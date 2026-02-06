import dagre from 'dagre';

export const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // AJUSTE DE CERCANÍA:
  // ranksep: Bajamos de 150 a 80 (distancia horizontal entre padre e hijo)
  // nodesep: Bajamos de 70 a 40 (distancia vertical entre hermanos)
  dagreGraph.setGraph({ 
  rankdir: 'LR', // Fuerza el crecimiento de Izquierda a Derecha
  ranksep: 100,  // Distancia entre niveles (Semilla -> Hijos)
  nodesep: 50,   // Distancia entre comentarios del mismo nivel
  ranker: 'tight-tree' // Optimiza la forma de árbol
});

  nodes.forEach((node) => {
    // Definimos el tamaño del "hitbox" del orbe para el cálculo
    dagreGraph.setNode(node.id, { width: 220, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 110,
      y: nodeWithPosition.y - 60,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
};