from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

class NodePosition(BaseModel):
    x: float
    y: float

class QuestNodeSchema(BaseModel):
    id: str
    type: str
    position: Optional[NodePosition] = None
    data: Dict[str, Any]

class QuestEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class QuestGraphPayload(BaseModel):
    id: str
    title: str = "Untitled Quest"
    rootNodeId: Optional[str] = None
    nodes: List[QuestNodeSchema]
    edges: List[QuestEdgeSchema]

class ValidationErrorItem(BaseModel):
    nodeId: Optional[str] = None
    edgeId: Optional[str] = None
    severity: Literal['error', 'warning', 'info']
    code: str
    message: str

class ValidationResponse(BaseModel):
    isValid: bool
    nodesCount: int
    edgesCount: int
    errors: List[ValidationErrorItem]

class ExportRequest(BaseModel):
    graph: QuestGraphPayload
    targetEngine: Literal['unity_csharp', 'godot_gdscript', 'json_compact']
    namespace: Optional[str] = "QuestCraft.Generated"

class ExportResponse(BaseModel):
    fileName: str
    targetEngine: str
    code: str
