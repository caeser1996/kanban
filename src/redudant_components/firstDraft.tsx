import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

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
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const stageConfig = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'planning', title: 'Planning' },
  { id: 'inProgress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'testing', title: 'Testing' },
  { id: 'deployment', title: 'Deployment' },
  { id: 'done', title: 'Done' },
];

const userList = [
  'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Williams', 'Charlie Brown',
  'Diana Davis', 'Edward Evans', 'Fiona Foster', 'George Green', 'Hannah Hill'
];

const KanbanBoard: React.FC = () => {
    console.log('KanbanBoard component is rendering');
  const [columns, setColumns] = useState<Column[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    type: 'Task'
  });

  useEffect(() => {
    console.log('useEffect is running');
    const storedColumns = localStorage.getItem('kanbanColumns');
    console.log(storedColumns?.length)
    if (storedColumns && storedColumns !== '[]') {
      setColumns(JSON.parse(storedColumns));
    } else {
        console.log('Initializing default columns');
      setColumns(stageConfig.map(stage => ({
        ...stage,
        tasks: []
      })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kanbanColumns', JSON.stringify(columns));
  }, [columns]);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newColumns = [...columns];
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (sourceColumn && destColumn) {
      const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
      movedTask.state = destColumn.title;
      destColumn.tasks.splice(destination.index, 0, movedTask);
      setColumns(newColumns);
    }
  };

  const openModal = (columnId: string) => {
    setCurrentColumn(columnId);
    setNewTask({...newTask, state: columns.find(col => col.id === columnId)?.title || '', id: Date.now().toString()});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewTask({
      id: '',
      title: '',
      state: '',
      assignee: '',
      tags: [],
      priority: 'Medium',
      areaPath: '',
      effort: 0,
      type: 'Task'
    });
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    const newColumns = columns.map(col => {
      if (col.id === currentColumn) {
        return {
          ...col,
          tasks: [...col.tasks, newTask]
        };
      }
      return col;
    });
    setColumns(newColumns);
    closeModal();
  };

  const deleteTask = (columnId: string, taskId: string) => {
    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: col.tasks.filter(task => task.id !== taskId)
        };
      }
      return col;
    });
    setColumns(newColumns);
  };

  return (
    <div className="p-4">
      <div className="flex space-x-4 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map(column => (
            <div key={column.id} className="w-64 flex-shrink-0">
              <div className="bg-gray-200 p-2 rounded">
                <h2 className="font-bold mb-2">{column.title}</h2>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="min-h-[200px]"
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-2 mb-2 bg-white rounded shadow"
                            >
                              <h3 className="font-bold">{task.title}</h3>
                              <p>Assignee: {task.assignee}</p>
                              <p>Priority: {task.priority}</p>
                              <button onClick={() => deleteTask(column.id, task.id)} className="text-red-500 mt-2">Delete</button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <button onClick={() => openModal(column.id)} className="bg-green-500 text-white p-1 rounded w-full mt-2">Add Task</button>
              </div>
            </div>
          ))}
        </DragDropContext>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Add New Task</h3>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Title"
              className="w-full p-2 mb-2 border rounded"
            />
            <select
              value={newTask.assignee}
              onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="">Select Assignee</option>
              {userList.map(user => (
                <option key={user} value={user}>{user}</option>
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

export default KanbanBoard;