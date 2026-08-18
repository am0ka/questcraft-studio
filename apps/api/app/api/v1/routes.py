from fastapi import APIRouter, HTTPException
from app.schemas.graph import QuestGraphPayload, ValidationResponse, ExportRequest, ExportResponse
from app.services.validator import GraphAnalysisService
from app.services.exporter import CodeGeneratorService, AIQuestNarrativeService
from pydantic import BaseModel

router = APIRouter(prefix="/v1/graph", tags=["Graph Operations"])

@router.post("/validate", response_model=ValidationResponse)
async def validate_graph_endpoint(payload: QuestGraphPayload):
    try:
        return GraphAnalysisService.validate_graph(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export", response_model=ExportResponse)
async def export_graph_endpoint(payload: ExportRequest):
    try:
        return CodeGeneratorService.export(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AIGenerateRequest(BaseModel):
    prompt: str
    speakerName: str = "NPC"

@router.post("/generate-ai")
async def generate_ai_node(req: AIGenerateRequest):
    return AIQuestNarrativeService.generate_next_dialogue(req.prompt, req.speakerName)
