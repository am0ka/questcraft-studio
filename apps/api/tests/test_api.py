import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from app.services.validator import GraphAnalysisService
from app.services.exporter import CodeGeneratorService, AIQuestNarrativeService
from app.schemas.graph import QuestGraphPayload, ExportRequest

client = TestClient(app)

@pytest.fixture
def full_graph():
    return {
        "id": "quest-witcher",
        "title": "The Witcher Contract",
        "rootNodeId": "node-1",
        "nodes": [
            {
                "id": "node-1",
                "type": "dialogueNode",
                "position": {"x": 0, "y": 0},
                "data": {
                    "label": "Tavern Intro",
                    "speakerName": "Elder",
                    "messageText": "A beast roams the forest.",
                    "options": [
                        {"id": "opt-1", "text": "Accept Quest"},
                        {"id": "opt-2", "text": "Decline"}
                    ]
                }
            },
            {
                "id": "node-cond",
                "type": "conditionNode",
                "position": {"x": 100, "y": 0},
                "data": {
                    "label": "Check Gold",
                    "rules": [{"variableKey": "inventory.gold", "operator": ">=", "value": 100}]
                }
            },
            {
                "id": "node-act",
                "type": "actionNode",
                "position": {"x": 200, "y": 0},
                "data": {
                    "label": "Give Reward",
                    "actions": [{"type": "give_item", "targetKey": "trophy", "value": 1}]
                }
            },
            {
                "id": "node-end",
                "type": "dialogueNode",
                "position": {"x": 300, "y": 0},
                "data": {
                    "label": "Success End",
                    "speakerName": "Elder",
                    "messageText": "Here is your pay.",
                    "options": [{"id": "opt-end", "text": "Leave"}]
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "node-1", "target": "node-cond", "sourceHandle": "opt-1"},
            {"id": "e2", "source": "node-cond", "target": "node-act", "sourceHandle": "true"},
            {"id": "e3", "source": "node-cond", "target": "node-1", "sourceHandle": "false"},
            {"id": "e4", "source": "node-act", "target": "node-end"}
        ]
    }

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "QuestCraft API"}

def test_validate_empty_graph():
    payload = {"id": "q1", "title": "Empty", "nodes": [], "edges": []}
    res = client.post("/api/v1/graph/validate", json=payload)
    assert res.status_code == 200
    assert res.json()["isValid"] is False
    assert res.json()["errors"][0]["code"] == "EMPTY_GRAPH"

def test_validate_missing_root_id():
    payload = {
        "id": "q1",
        "title": "No Root",
        "rootNodeId": "non-existent-root",
        "nodes": [{"id": "n1", "type": "dialogueNode", "data": {"label": "N1"}}],
        "edges": []
    }
    res = client.post("/api/v1/graph/validate", json=payload)
    assert res.status_code == 200
    assert any(e["code"] == "NO_ROOT_NODE" for e in res.json()["errors"])

def test_validate_full_graph_with_cycles_and_unreachable(full_graph):
    full_graph["nodes"].append({
        "id": "node-isolated",
        "type": "dialogueNode",
        "data": {"label": "Empty Choices", "options": []}
    })
    full_graph["edges"].append({
        "id": "e-bad",
        "source": "node-1",
        "target": "ghost-node"
    })
    res = client.post("/api/v1/graph/validate", json=full_graph)
    assert res.status_code == 200
    data = res.json()
    assert any(e["code"] == "DANGLING_EDGE" for e in data["errors"])
    assert any(e["code"] == "UNREACHABLE_NODE" for e in data["errors"])
    assert any(e["code"] == "EMPTY_CHOICES" for e in data["errors"])
    assert any(e["code"] == "DETECTED_CYCLE" for e in data["errors"])

def test_export_all_targets(full_graph):
    # 1. Unity C# Export
    req_unity = {"graph": full_graph, "targetEngine": "unity_csharp", "namespace": "Studio.Quests"}
    res_unity = client.post("/api/v1/graph/export", json=req_unity)
    assert res_unity.status_code == 200
    assert "public class TheWitcherContractQuest : ScriptableObject" in res_unity.json()["code"]

    # Export with empty title (sanitizer fallback test)
    empty_title_graph = dict(full_graph)
    empty_title_graph["title"] = "--- $$$ ---"
    res_fallback = client.post("/api/v1/graph/export", json={"graph": empty_title_graph, "targetEngine": "unity_csharp"})
    assert res_fallback.status_code == 200
    assert "public class MyQuestQuest : ScriptableObject" in res_fallback.json()["code"]

    # 2. Godot GDScript Export
    req_godot = {"graph": full_graph, "targetEngine": "godot_gdscript"}
    res_godot = client.post("/api/v1/graph/export", json=req_godot)
    assert res_godot.status_code == 200
    assert "class_name TheWitcherContractQuest" in res_godot.json()["code"]

    # 3. Compact JSON Export
    req_json = {"graph": full_graph, "targetEngine": "json_compact"}
    res_json = client.post("/api/v1/graph/export", json=req_json)
    assert res_json.status_code == 200
    assert res_json.json()["fileName"].endswith(".json")

def test_ai_narrative_scenarios():
    for _ in range(5):
        res = client.post("/api/v1/graph/generate-ai", json={"prompt": "Ancient artifact", "speakerName": "Wizard"})
        assert res.status_code == 200
        assert "message" in res.json()
        assert len(res.json()["options"]) > 0

def test_error_handlers():
    with patch.object(GraphAnalysisService, 'validate_graph', side_effect=Exception("Database error")):
        res = client.post("/api/v1/graph/validate", json={"id": "1", "title": "Err", "nodes": [], "edges": []})
        assert res.status_code == 500

    with patch.object(CodeGeneratorService, 'export', side_effect=Exception("Codegen failure")):
        res = client.post("/api/v1/graph/export", json={"graph": {"id": "1", "title": "Err", "nodes": [], "edges": []}, "targetEngine": "json_compact"})
        assert res.status_code == 500