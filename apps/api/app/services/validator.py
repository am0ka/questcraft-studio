import networkx as nx
from typing import List
from app.schemas.graph import QuestGraphPayload, ValidationErrorItem, ValidationResponse

class GraphAnalysisService:
    @classmethod
    def validate_graph(cls, graph_data: QuestGraphPayload) -> ValidationResponse:
        errors: List[ValidationErrorItem] = []
        nodes = graph_data.nodes
        edges = graph_data.edges

        if not nodes:
            return ValidationResponse(
                isValid=False,
                nodesCount=0,
                edgesCount=0,
                errors=[ValidationErrorItem(
                    severity="error",
                    code="EMPTY_GRAPH",
                    message="The graph does not contain any nodes."
                )]
            )

        # Building a directed graph in NetworkX
        G = nx.DiGraph()
        node_map = {n.id: n for n in nodes}

        for n in nodes:
            G.add_node(n.id, type=n.type, data=n.data)

        for e in edges:
            G.add_edge(e.source, e.target, id=e.id, sourceHandle=e.sourceHandle)

        # 1. Checking the root node (Root Node)
        root_id = graph_data.rootNodeId or (nodes[0].id if nodes else None)
        if not root_id or root_id not in node_map:
            errors.append(ValidationErrorItem(
                severity="error",
                code="NO_ROOT_NODE",
                message="The root node of the quest is not defined (Root Node)."
            ))

        # 2. Checking dangling edges
        for edge in edges:
            if edge.source not in node_map or edge.target not in node_map:
                errors.append(ValidationErrorItem(
                    edgeId=edge.id,
                    severity="error",
                    code="DANGLING_EDGE",
                    message=f"Edge {edge.id} points to a non-existent node ({edge.source} -> {edge.target})."
                ))

        # 3. Finding unreachable nodes (Unreachable Nodes via BFS/DFS from Root)
        if root_id and root_id in G:
            reachable = nx.descendants(G, root_id)
            reachable.add(root_id)

            for node_id in node_map.keys():
                if node_id not in reachable:
                    errors.append(ValidationErrorItem(
                        nodeId=node_id,
                        severity="warning",
                        code="UNREACHABLE_NODE",
                        message=f"Node [{node_map[node_id].data.get('label', node_id)}] is unreachable from the starting point."
                    ))

        # 4. Finding infinite cycles without exit options
        try:
            cycles = list(nx.simple_cycles(G))
            for cycle in cycles:
                cycle_names = [node_map[nid].data.get('label', nid) for nid in cycle if nid in node_map]
                errors.append(ValidationErrorItem(
                    nodeId=cycle[0],
                    severity="warning",
                    code="DETECTED_CYCLE",
                    message=f"Found a cycle: {' -> '.join(cycle_names)}"
                ))
        except Exception:
            pass

        # 5. Checking dialogue nodes without response options
        for n in nodes:
            if n.type == "dialogueNode":
                options = n.data.get("options", [])
                if not options:
                    errors.append(ValidationErrorItem(
                        nodeId=n.id,
                        severity="warning",
                        code="EMPTY_CHOICES",
                        message=f"Dialogue [{n.data.get('speakerName', 'NPC')}] does not contain response options."
                    ))

        has_errors = any(e.severity == "error" for e in errors)

        return ValidationResponse(
            isValid=not has_errors,
            nodesCount=len(nodes),
            edgesCount=len(edges),
            errors=errors
        )
