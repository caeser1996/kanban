import { format } from "date-fns";
import { Briefcase, Edit, Filter, Plus, Trash2, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const stageConfig = [
  { id: "pending", title: "Pending" },
  { id: "on_hold", title: "On Hold" },
  { id: "closed", title: "Closed" },
];

const boardNames = ["DISCO", "SUPPLIER SHORTAGE", "HUNTING"];

interface Activity {
  timestamp: string;
  action: string;
  user: string;
}

interface Comment {
  id: string;
  text: string;
  user: string;
  timestamp: string;
}

interface Note {
  id: string;
  text: string;
  user: string;
  timestamp: string;
}

interface Task {
  id: string;
  title: string;
  state: string;
  analyst: string;
  accountManager: string;
  launchDate: string;
  molecule: string;
  description: string;
  activities: Activity[];
  comments: Comment[];
  notes: Note[];
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
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alice Johnson" },
  { id: 4, name: "Bob Williams" },
  { id: 5, name: "Charlie Brown" },
];

const MultiKanbanBoard: React.FC = () => {
  const [boardStates, setBoardStates] = useState<BoardState>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBoard, setCurrentBoard] = useState(boardNames[0]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task>({
    id: "",
    title: "",
    state: "Pending",
    analyst: "",
    accountManager: "",
    launchDate: "",
    molecule: "",
    description: "",
    activities: [],
    comments: [],
    notes: [],
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedAnalyst, setSelectedAnalyst] = useState("");
  const [selectedAccountManager, setSelectedAccountManager] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [expandedBoards, setExpandedBoards] = useState<string[]>([boardNames[0]]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const initialBoardStates: BoardState = {};
    boardNames.forEach((boardName) => {
      const storedColumns = localStorage.getItem(
        `kanbanColumns_${boardName.toLowerCase()}`
      );
      if (storedColumns) {
        initialBoardStates[boardName] = JSON.parse(storedColumns);
      } else {
        initialBoardStates[boardName] = stageConfig.map((stage) => ({
          ...stage,
          tasks: [],
        }));
      }
    });
    setBoardStates(initialBoardStates);
  }, []);

  useEffect(() => {
    Object.entries(boardStates).forEach(([boardName, columns]) => {
      localStorage.setItem(
        `kanbanColumns_${boardName.toLowerCase()}`,
        JSON.stringify(columns)
      );
    });
  }, [boardStates]);

  const onDragEnd = (result: any) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const [sourceBoardName, sourceColumnId] = source.droppableId.split('|');
    const [destBoardName, destColumnId] = destination.droppableId.split('|');

    const newBoardStates = { ...boardStates };
    const sourceBoard = newBoardStates[sourceBoardName];
    const destBoard = newBoardStates[destBoardName];

    const sourceColumn = sourceBoard.find((col) => col.id === sourceColumnId);
    const destColumn = destBoard.find((col) => col.id === destColumnId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    const sourceBoardIndex = boardNames.indexOf(sourceBoardName);
    const destBoardIndex = boardNames.indexOf(destBoardName);

    const isAllowedMove =
      (sourceBoardName === destBoardName) ||
      (Math.abs(destBoardIndex - sourceBoardIndex) === 1 && destColumnId === "pending");

    if (isAllowedMove) {
      const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
      const oldState = movedTask.state;
      const oldBoard = sourceBoardName;
      movedTask.state = destColumn.title;
      destColumn.tasks.splice(destination.index, 0, movedTask);

      // Update activity log for the task movement
      const activityLog = {
        timestamp: new Date().toISOString(),
        action: `Moved from ${oldBoard} - ${oldState} to ${destBoardName} - ${movedTask.state}`,
        user: "Current User", // Replace with actual user info when available
      };
      movedTask.activities = [...(movedTask.activities || []), activityLog];

      setBoardStates(newBoardStates);
    }
  };

  const openModal = (boardName: string, task?: Task) => {
    setCurrentBoard(boardName);
    if (task) {
      setEditingTask(task);
      setNewTask({ ...task, activities: task.activities || [], comments: task.comments || [], notes: task.notes || [] });
    } else {
      setEditingTask(null);
      setNewTask({
        id: Date.now().toString(),
        title: "",
        state: "Pending",
        analyst: "",
        accountManager: "",
        launchDate: "",
        molecule: "",
        description: "",
        activities: [],
        comments: [],
        notes: [],
      });
    }
    setIsModalOpen(true);
    setActiveTab("details");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setActiveTab("details");
  };

  const addOrUpdateTask = () => {
    if (!newTask.title.trim()) return;

    const newBoardStates = { ...boardStates };
    const board = newBoardStates[currentBoard];
    const pendingColumn = board.find((col) => col.id === "pending");

    if (pendingColumn) {
      if (editingTask) {
        const taskIndex = pendingColumn.tasks.findIndex(
          (t) => t.id === editingTask.id
        );
        if (taskIndex !== -1) {
          const updatedTask = {
            ...newTask,
            activities: [
              ...(newTask.activities || []),
              {
                timestamp: new Date().toISOString(),
                action: "Task updated",
                user: "Current User", // Replace with actual user info when available
              },
            ],
          };
          pendingColumn.tasks[taskIndex] = updatedTask;
        }
      } else {
        const newTaskWithActivity = {
          ...newTask,
          activities: [
            {
              timestamp: new Date().toISOString(),
              action: "Task created",
              user: "Current User", // Replace with actual user info when available
            },
          ],
        };
        pendingColumn.tasks.push(newTaskWithActivity);
      }
      setBoardStates(newBoardStates);
    }
    closeModal();
  };

  const deleteTask = (boardName: string, columnId: string, taskId: string) => {
    const newBoardStates = { ...boardStates };
    const board = newBoardStates[boardName];
    const column = board.find((col) => col.id === columnId);

    if (column) {
      column.tasks = column.tasks.filter((task) => task.id !== taskId);
      setBoardStates(newBoardStates);
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      user: "Current User", // Replace with actual user info when available
      timestamp: new Date().toISOString(),
    };
    setNewTask((prevTask) => ({
      ...prevTask,
      comments: [...(prevTask.comments || []), comment],
    }));
    setNewComment("");
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      text: newNote,
      user: "Current User", // Replace with actual user info when available
      timestamp: new Date().toISOString(),
    };
    setNewTask((prevTask) => ({
      ...prevTask,
      notes: [...(prevTask.notes || []), note],
    }));
    setNewNote("");
  };

  const filteredBoardStates = Object.entries(boardStates).reduce((acc, [boardName, columns]) => {
    const filteredColumns = columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => {
        const matchesKeyword = task.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          task.molecule.toLowerCase().includes(searchKeyword.toLowerCase());
        const matchesAnalyst = !selectedAnalyst || task.analyst === selectedAnalyst;
        const matchesAccountManager = !selectedAccountManager || task.accountManager === selectedAccountManager;
        const matchesDateRange = (!dateRange.from || !dateRange.to) ||
          (task.launchDate >= dateRange.from && task.launchDate <= dateRange.to);
        return matchesKeyword && matchesAnalyst && matchesAccountManager && matchesDateRange;
      }),
    }));
    acc[boardName] = filteredColumns;
    return acc;
  }, {} as BoardState);

  const toggleBoardExpansion = (boardName: string) => {
    setExpandedBoards((prev) =>
      prev.includes(boardName)
        ? prev.filter((name) => name !== boardName)
        : [...prev, boardName]
    );
  };

  const getBoardSummary = (columns: Column[]) => {
    const pendingCount = columns.find(col => col.id === "pending")?.tasks.length || 0;
    const onHoldCount = columns.find(col => col.id === "on_hold")?.tasks.length || 0;
    const closedCount = columns.find(col => col.id === "closed")?.tasks.length || 0;
    return `Pending: ${pendingCount}, On Hold: ${onHoldCount}, Closed: ${closedCount}`;
  };

  return (
    <div className="h-screen flex flex-col bg-white p-4">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="bg-purple-100 text-purple-700 p-2 rounded mr-2"
          >
            <Filter size={16} />
          </button>
          <button
            onClick={() => openModal(currentBoard)}
            className="bg-purple-100 text-purple-700 p-2 rounded flex items-center"
            disabled={!currentBoard}
          >
            <Plus size={16} className="mr-2" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* Filters */}
      {isFilterVisible && (
        <div className="mb-4 flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by keyword"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <select
            value={selectedAnalyst}
            onChange={(e) => setSelectedAnalyst(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Analyst</option>
            {userList.map((user) => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
          <select
            value={selectedAccountManager}
            onChange={(e) => setSelectedAccountManager(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Account Manager</option>
            {userList.map((user) => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-auto">
          {Object.entries(filteredBoardStates).map(([boardName, columns], boardIndex) => (
            <div key={boardName} className="mb-4">
              <button
                onClick={() => toggleBoardExpansion(boardName)}
                className="w-full text-left font-bold p-2 bg-gray-100 hover:bg-gray-200 rounded flex justify-between items-center"
              >
                <span>{boardName} {expandedBoards.includes(boardName) ? '▼' : '►'}</span>
                {!expandedBoards.includes(boardName) && (
                  <span className="text-sm font-normal">{getBoardSummary(columns)}</span>
                )}
              </button>
              {expandedBoards.includes(boardName) && (
                <div className="flex mt-2" style={{ height: '400px' }}>
                  {columns.map((column) => (
                    <div key={column.id} className="flex-1 px-2">
                      <h3 className="font-bold mb-2">{column.title}</h3>
                      <Droppable droppableId={`${boardName}|${column.id}`}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="bg-gray-100 p-2 rounded overflow-y-auto"
                            style={{ height: 'calc(100% - 30px)' }}
                          >
                            {column.tasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="bg-white p-2 mb-2 rounded shadow"
                                  >
                                    <div className="font-semibold">{task.title}</div>
                                    <div className="text-sm text-gray-600">{task.molecule}</div>
                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                      <User size={12} className="mr-1" />
                                      <span className="mr-2">{task.analyst}</span>
                                      <Briefcase size={12} className="mr-1" />
                                      <span>{task.accountManager}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                      <div className="text-xs text-gray-500">
                                        {task.launchDate}
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => openModal(boardName, task)}
                                          className="text-blue-500"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button
                                          onClick={() => deleteTask(boardName, column.id, task.id)}
                                          className="text-red-500"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal for adding/editing task */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-5 rounded-lg w-3/4 max-w-4xl">
            <h3 className="text-lg font-bold mb-4">
              {editingTask ? "Edit Opportunity" : "Add New Opportunity"}
            </h3>
            {editingTask && (
              <div className="mb-4">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`mr-2 p-2 ${activeTab === "details" ? "bg-purple-100 text-purple-700" : "bg-gray-200"}`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`mr-2 p-2 ${activeTab === "activity" ? "bg-purple-100 text-purple-700" : "bg-gray-200"}`}
                >
                  Activity Log
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`p-2 ${activeTab === "notes" ? "bg-purple-100 text-purple-700" : "bg-gray-200"}`}
                >
                  Notes
                </button>
              </div>
            )}
            {activeTab === "details" && (
              <div>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Title"
                  className="w-full p-2 mb-2 border rounded"
                />
                <input
                  type="text"
                  value={newTask.molecule}
                  onChange={(e) => setNewTask({ ...newTask, molecule: e.target.value })}
                  placeholder="Molecule"
                  className="w-full p-2 mb-2 border rounded"
                />
                <select
                  value={newTask.analyst}
                  onChange={(e) => setNewTask({ ...newTask, analyst: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                >
                  <option value="">Select Analyst</option>
                  {userList.map((user) => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))}
                </select>
                <select
                  value={newTask.accountManager}
                  onChange={(e) => setNewTask({ ...newTask, accountManager: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                >
                  <option value="">Select Account Manager</option>
                  {userList.map((user) => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTask.launchDate}
                  onChange={(e) => setNewTask({ ...newTask, launchDate: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                />
                <div style={{ height: '200px' }}>
                  <ReactQuill
                    value={newTask.description}
                    onChange={(content) => setNewTask((prevTask) => ({ ...prevTask, description: content }))}
                    style={{ height: '150px' }}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
                {editingTask && (
                  <div className="mt-4">
                    <h4 className="font-bold mb-2">Comments</h4>
                    <div className="max-h-40 overflow-y-auto mb-2">
                      {newTask.comments && newTask.comments.map((comment, index) => (
                        <div key={index} className="mb-2 p-2 bg-gray-100 rounded">
                          <p className="text-sm text-gray-600">{format(new Date(comment.timestamp), "PPpp")}</p>
                          <p>{comment.text}</p>
                          <p className="text-sm text-gray-600">By: {comment.user}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment"
                        className="flex-grow p-2 border rounded-l"
                      />
                      <button
                        onClick={addComment}
                        className="bg-purple-100 text-purple-700 p-2 rounded-r"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === "activity" && editingTask && (
              <div className="max-h-96 overflow-y-auto">
                {newTask.activities && newTask.activities.map((activity, index) => (
                  <div key={index} className="mb-2 p-2 bg-gray-100 rounded">
                    <p className="text-sm text-gray-600">{format(new Date(activity.timestamp), "PPpp")}</p>
                    <p>{activity.action}</p>
                    <p className="text-sm text-gray-600">By: {activity.user}</p>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "notes" && editingTask && (
              <div>
                <h4 className="font-bold mb-2">Notes</h4>
                <div className="max-h-60 overflow-y-auto mb-2">
                  {newTask.notes && newTask.notes.map((note, index) => (
                    <div key={index} className="mb-2 p-2 bg-gray-100 rounded">
                      <p className="text-sm text-gray-600">{format(new Date(note.timestamp), "PPpp")}</p>
                      <p>{note.text}</p>
                      <p className="text-sm text-gray-600">By: {note.user}</p>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note"
                    className="flex-grow p-2 border rounded-l"
                  />
                  <button
                    onClick={addNote}
                    className="bg-purple-100 text-purple-700 p-2 rounded-r"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={closeModal}
                className="bg-gray-300 text-gray-700 p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={addOrUpdateTask}
                className="bg-purple-100 text-purple-700 p-2 rounded"
              >
                {editingTask ? "Update Opportunity" : "Add Opportunity"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiKanbanBoard;