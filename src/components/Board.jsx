import React, { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css'; 
import SynapseNode from './SynapseNode';
import { getLayoutedElements } from '../utils/layout';
import { supabase } from '../lib/supabase';

const nodeTypes = { synapse: SynapseNode };

const Board = ({ messages, isAdmin, userAlias, onReply }) => {
  const [isolatedId, setIsolatedId] = useState(null);

  // Función para encontrar todos los descendientes de un nodo (hijos, nietos, etc.)
  const getDescendants = useCallback((parentId, allMessages, result = []) => {
    const children = allMessages.filter(m => m.parent_id === parentId);
    children.forEach(child => {
      result.push(child);
      getDescendants(child.id, allMessages, result);
    });
    return result;
  }, []);

  // 1. Procesamiento de Nodos y Edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!messages || messages.length === 0) return { initialNodes: [], initialEdges: [] };

    // --- LÓGICA DE AISLAMIENTO ---
    let visibleMessages = messages;
    if (isolatedId) {
      const rootNode = messages.find(m => m.id === isolatedId);
      const descendants = getDescendants(isolatedId, messages);
      visibleMessages = rootNode ? [rootNode, ...descendants] : messages;
    }

    // Creamos los nodos base usando los mensajes visibles
    let nodes = visibleMessages.map(msg => ({
      id: msg.id,
      type: 'synapse',
      data: { 
        msg, 
        isAdminView: isAdmin, 
        userAlias, 
        onReply, 
        isRoot: !msg.parent_id,
        onIsolate: () => setIsolatedId(msg.id) // Función para activar el aislamiento
      },
      position: { x: msg.x_pos || 0, y: msg.y_pos || 0 }
    }));

    // Creamos las conexiones
    const seed = visibleMessages.find(m => !m.parent_id);

    const edges = visibleMessages
      .filter(msg => msg.id !== (isolatedId || seed?.id)) // No conectar el nodo raíz del modo actual
      .map(msg => {
        // Si estamos aislados, el padre por defecto es el nodo aislado. Si no, la semilla.
        const defaultParent = isolatedId || seed?.id;
        const parentId = msg.parent_id || defaultParent; 
        
        return {
          id: `e-${parentId}-${msg.id}`,
          source: parentId,
          target: msg.id,
          animated: true,
          type: 'default',
          style: { 
            stroke: msg.color_theme || '#6366f1', 
            strokeWidth: 1.2, // Líneas más delgadas y elegantes
            opacity: 0.8 
          },
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            color: msg.color_theme || '#6366f1',
            width: 15, height: 15 
          },
        };
      });

    // Calculamos el layout automático
    const layouted = getLayoutedElements(nodes, edges, 'LR');
    
    // PRIORIDAD: Si el mensaje ya tiene posición manual en la DB, la respetamos
    const finalNodes = layouted.nodes.map(node => {
      const msg = visibleMessages.find(m => m.id === node.id);
      if (msg && msg.x_pos !== null && msg.x_pos !== undefined) {
        return { 
          ...node, 
          position: { x: msg.x_pos, y: msg.y_pos } 
        };
      }
      return node;
    });

    return { initialNodes: finalNodes, initialEdges: layouted.edges };
  }, [messages, isAdmin, userAlias, onReply, isolatedId, getDescendants]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 2. Función para persistir el movimiento del Administrador
  const onNodeDragStop = useCallback(async (event, node) => {
    if (!isAdmin) return;
    const { id, position } = node;
    
    const { error } = await supabase
      .from('intervenciones')
      .update({ 
        x_pos: Math.round(position.x), 
        y_pos: Math.round(position.y) 
      })
      .eq('id', id);

    if (error) console.error("Error al sincronizar posición:", error);
  }, [isAdmin]);

  return (
    <div className="w-full h-full bg-[#0a0a0c] relative">
      {/* BOTÓN DE REGRESO A GLOBAL */}
      {isolatedId && (
        <button 
          onClick={() => setIsolatedId(null)}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-500 hover:text-white transition-all backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          ← Regresar a Conversación Global
        </button>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView 
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={isAdmin}
      >
        <Background color="#1e1e24" gap={40} size={1} variant="dots" className="opacity-10" />
        <Controls className="!bg-indigo-950/80 !border-indigo-500/50 !fill-indigo-400 hover:!fill-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
      </ReactFlow>
    </div>
  );
};

export default Board;