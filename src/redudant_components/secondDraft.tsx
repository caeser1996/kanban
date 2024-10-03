import { UserCircle } from 'lucide-react';
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

const boardNames = ['Heading 1', 'Heading 2', 'Heading 3'];

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

  const openModal = (boardName: string, columnId: string) => {
    setCurrentBoard(boardName);
    setCurrentColumn(columnId);
    const column = boardStates[boardName].find(col => col.id === columnId);
    setNewTask({
      id: Date.now().toString(),
      title: '',
      state: column ? column.title : '',
      assignee: '',
      tags: [],
      priority: 'Medium',
      areaPath: '',
      effort: 0,
      type: 'Task',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    const newBoardStates = { ...boardStates };
    const board = newBoardStates[currentBoard];
    const column = board.find(col => col.id === currentColumn);
    
    if (column) {
      column.tasks.push(newTask);
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
    <div className="h-screen flex flex-col">
      {/* Stage headers */}
      <div className="flex border-b">
        <div className="w-1/10"></div>
        {stageConfig.map((stage) => (
          <div key={stage.id} className="flex-1 text-center p-2 font-bold">
            {stage.title}
          </div>
        ))}
      </div>

      {/* Boards */}
      <div className="flex-1 overflow-auto">
        {boardNames.map((boardName, boardIndex) => (
          <div key={boardIndex} className="flex mb-4">
            {/* Heading */}
            <div className="w-1/10 flex items-center justify-center font-bold">
              {boardName}
            </div>

            {/* Kanban Board */}
            <div className="flex-1">
              <DragDropContext onDragEnd={(result) => onDragEnd(result, boardName)}>
                <div className="flex h-64"> {/* Adjust height as needed */}
                  {boardStates[boardName]?.map((column, columnIndex) => (
                    <div key={column.id} className="flex-1 px-1">
                      <Droppable droppableId={column.id}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="bg-gray-100 h-full p-1 rounded text-sm"
                          >
                            {column.tasks.map((task, taskIndex) => (
                              <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="p-1 mb-1 bg-white rounded shadow"
                                  >
                                    <div className="font-bold truncate">{task.title}</div>
                                    <div className="text-xs">Assignee: {task.assignee}</div>
                                    <div className="text-xs">Priority: {task.priority}</div>
                                    <button onClick={() => deleteTask(boardName, column.id, task.id)} className="text-red-500 text-xs mt-1">Delete</button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            <button onClick={() => openModal(boardName, column.id)} className="bg-green-500 text-white p-1 rounded w-full mt-1 text-xs">Add Task</button>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for adding new task */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-5 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Add New Task</h3>
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
                  <UserCircle size={16} className="inline mr-2" />
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
              <button onClick={closeModal} className="bg-red-500 text-white p-2 rounded mr-2">Cancel</button>
              <button onClick={addTask} className="bg-green-500 text-white p-2 rounded">Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiKanbanBoard;