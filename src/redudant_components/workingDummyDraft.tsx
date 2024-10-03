import { Edit, Plus, Trash2, UserCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

const stageConfig = [
  { id: "backlog", title: "Stage 1" },
  { id: "analyze", title: "Stage 2" },
  { id: "develop", title: "Stage 3" },
  { id: "test", title: "Stage 4" },
  { id: "done", title: "Stage 5" },
  { id: "review", title: "Stage 6" },
];

const boardNames = ['Team 1', 'Team 2', 'Team 3'];

interface Task {
  id: string;
  title: string;
  state: string;
  assignee: string;
  tags: string[];
  priority: string;
  areaPath: string;
  effort: number;
  type: string;
  dueDate?: string;
  iteration?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface BoardState {
  [key: string]: Column[];
}

const userList = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Alice Johnson' },
  { id: 4, name: 'Bob Williams' },
  { id: 5, name: 'Charlie Brown' },
];

const MultiKanbanBoard: React.FC = () => {
  const [boardStates, setBoardStates] = useState<BoardState>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBoard, setCurrentBoard] = useState('');
  const [currentColumn, setCurrentColumn] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    id: '',
    title: '',
    state: '',
    assignee: '',
    tags: [],
    priority: 'Medium',
    areaPath: '',
    effort: 0,
    type: 'Task',
  });

  useEffect(() => {
    const initialBoardStates: BoardState = {};
    boardNames.forEach(boardName => {
      const storedColumns = localStorage.getItem(`kanbanColumns_${boardName.toLowerCase()}`);
      if (storedColumns) {
        initialBoardStates[boardName] = JSON.parse(storedColumns);
      } else {
        initialBoardStates[boardName] = stageConfig.map(stage => ({
          ...stage,
          tasks: []
        }));
      }
    });
    setBoardStates(initialBoardStates);
  }, []);

  useEffect(() => {
    Object.entries(boardStates).forEach(([boardName, columns]) => {
      localStorage.setItem(`kanbanColumns_${boardName.toLowerCase()}`, JSON.stringify(columns));
    });
  }, [boardStates]);

  const onDragEnd = (result: any, boardName: string) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newBoardStates = { ...boardStates };
    const board = newBoardStates[boardName];
    const sourceColumn = board.find(col => col.id === source.droppableId);
    const destColumn = board.find(col => col.id === destination.droppableId);

    if (sourceColumn && destColumn) {
      const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
      movedTask.state = destColumn.title;
      destColumn.tasks.splice(destination.index, 0, movedTask);
      setBoardStates(newBoardStates);
    }
  };

  const openModal = (boardName: string, columnId: string, task?: Task) => {
    setCurrentBoard(boardName);
    setCurrentColumn(columnId);
    if (task) {
      setEditingTask(task);
      setNewTask(task);
    } else {
      setEditingTask(null);
      setNewTask({
        id: Date.now().toString(),
        title: '',
        state: boardStates[boardName].find(col => col.id === columnId)?.title || '',
        assignee: '',
        tags: [],
        priority: 'Medium',
        areaPath: '',
        effort: 0,
        type: 'Task',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const addOrUpdateTask = () => {
    if (!newTask.title.trim()) return;
    
    const newBoardStates = { ...boardStates };
    const board = newBoardStates[currentBoard];
    const column = board.find(col => col.id === currentColumn);
    
    if (column) {
      if (editingTask) {
        const taskIndex = column.tasks.findIndex(t => t.id === editingTask.id);
        if (taskIndex !== -1) {
          column.tasks[taskIndex] = newTask;
        }
      } else {
        column.tasks.push(newTask);
      }
      setBoardStates(newBoardStates);
    }
    closeModal();
  };

  const deleteTask = (boardName: string, columnId: string, taskId: string) => {
    const newBoardStates = { ...boardStates };
    const board = newBoardStates[boardName];
    const column = board.find(col => col.id === columnId);
    
    if (column) {
      column.tasks = column.tasks.filter(task => task.id !== taskId);
      setBoardStates(newBoardStates);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Stage headers */}
      <div className="flex border-b bg-white">
        <div className="w-1/6 p-2 font-semibold text-gray-600">Work Item</div>
        {stageConfig.map((stage) => (
          <div key={stage.id} className="flex-1 text-center p-2 font-semibold text-gray-600">
            {stage.title}
            <span className="ml-2 text-sm text-gray-400">{boardStates[boardNames[0]]?.find(col => col.id === stage.id)?.tasks.length || 0}</span>
          </div>
        ))}
      </div>

      {/* Boards */}
      <div className="flex-1 overflow-auto">
        {boardNames.map((boardName, boardIndex) => (
          <div key={boardIndex} className="mb-4">
            {/* Team header */}
            <div className="bg-blue-100 p-2 font-semibold text-blue-700">{boardName}</div>

            <div className="flex">
              {/* Work Item column */}
              <div className="w-1/6 bg-white p-2">
                <button 
                  onClick={() => openModal(boardName, 'backlog')} 
                  className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  New item
                </button>
              </div>

              {/* Kanban Board */}
              <div className="flex-1 flex">
                <DragDropContext onDragEnd={(result) => onDragEnd(result, boardName)}>
                  {boardStates[boardName]?.map((column, columnIndex) => (
                    <div key={column.id} className="flex-1 px-1">
                      <Droppable droppableId={column.id}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="bg-gray-100 h-full p-1 rounded"
                          >
                            <div className="min-h-[200px]">
                              {column.tasks.map((task, taskIndex) => (
                                <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="p-2 mb-2 bg-white rounded shadow-sm hover:shadow group"
                                    >
                                      <div className="font-semibold text-sm truncate">{task.title}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        <span className="mr-2">{task.id}</span>
                                        <span>{task.type}</span>
                                      </div>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center">
                                          <UserCircle size={16} className="text-gray-400 mr-1" />
                                          <span className="text-xs text-gray-600">{task.assignee}</span>
                                        </div>
                                        <div className="hidden group-hover:flex">
                                          <button onClick={() => openModal(boardName, column.id, task)} className="text-blue-500 mr-2">
                                            <Edit size={14} />
                                          </button>
                                          <button onClick={() => deleteTask(boardName, column.id, task.id)} className="text-red-500">
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </DragDropContext>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for adding/editing task */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-5 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Title"
              className="w-full p-2 mb-2 border rounded"
            />
            <input
              type="text"
              value={newTask.id}
              readOnly
              placeholder="ID (auto-generated)"
              className="w-full p-2 mb-2 border rounded bg-gray-100"
            />
            <input
              type="text"
              value={newTask.state}
              readOnly
              placeholder="State"
              className="w-full p-2 mb-2 border rounded bg-gray-100"
            />
            <select
              value={newTask.assignee}
              onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="">Select Assignee</option>
              {userList.map(user => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newTask.tags.join(', ')}
              onChange={(e) => setNewTask({...newTask, tags: e.target.value.split(', ')})}
              placeholder="Tags (comma-separated)"
              className="w-full p-2 mb-2 border rounded"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <input
              type="text"
              value={newTask.areaPath}
              onChange={(e) => setNewTask({...newTask, areaPath: e.target.value})}
              placeholder="Area Path"
              className="w-full p-2 mb-2 border rounded"
            />
            <input
              type="number"
              value={newTask.effort}
              onChange={(e) => setNewTask({...newTask, effort: parseInt(e.target.value) || 0})}
              placeholder="Effort/Story Points"
              className="w-full p-2 mb-2 border rounded"
            />
            <select
              value={newTask.type}
              onChange={(e) => setNewTask({...newTask, type: e.target.value})}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="Task">Task</option>
              <option value="Bug">Bug</option>
              <option value="User Story">User Story</option>
              <option value="Epic">Epic</option>
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              placeholder="Due Date"
              className="w-full p-2 mb-2 border rounded"
            />
            <input
              type="text"
              value={newTask.iteration}
              onChange={(e) => setNewTask({...newTask, iteration: e.target.value})}
              placeholder="Iteration"
              className="w-full p-2 mb-2 border rounded"
            />
            <div className="flex justify-end mt-4">
              <button onClick={closeModal} className="bg-gray-300 text-gray-700 p-2 rounded mr-2">Cancel</button>
              <button onClick={addOrUpdateTask} className="bg-blue-500 text-white p-2 rounded">
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiKanbanBoard;