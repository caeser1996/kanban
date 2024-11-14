import { format } from "date-fns";
import { Briefcase, Calendar, Copy, Edit, FileText, Filter, MoreVertical, Plus, Trash2, User, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import './MultiKanbanBoardGenerated.css';

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
  molecule: string;
  state: string;
  analyst: string;
  accountManager: string;
  description: string;
  launchDate: string;
  activities: Activity[];
  comments: Comment[];
  notes: Note[];

  // Optional fields (new)
  status?: string;
  stage?: string;
  estimatedAnnualRevenue?: string;
  estimatedAnnualGP?: string;
  awardedValue?: string;
  gsmsBidValue?: string;
  submissionDueDate?: string;
  negotiationsDate?: string;
  fprDate?: string;
  awardDate?: string;
  ngBidStatus?: string;
  solicitationNumber?: string;
  awardingAgency?: string;
  awardee?: string;
  source?: string;
  strategy?: string;
  agency?: string;
  nadWaiver?: boolean;
  siteTransfer?: boolean;
  primaryPartner?: string;
  backupPartner1?: string;
  backupPartner2?: string;
  reverseAuction?: boolean;
  negotiation?: boolean;
  concepts?: {
    mg500: boolean;
    mg750: boolean;
  };
  packageSizes?: string[];
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
      {(isModalOpen && !editingTask) && (
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
                <div style={{ height: '500px' }}>
                  <ReactQuill
                    value={newTask.description}
                    onChange={(content) => setNewTask((prevTask) => ({ ...prevTask, description: content }))}
                    style={{ height: '500px' }}
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
      {/* Edit Modal */}
      {isModalOpen && editingTask && (
        <div className="fixed inset-0 bg-white z-50">
          {/* Header */}
          <div className="flex items-center h-12 bg-white">
            <div className="flex-1 flex items-center px-4 gap-2">
              <div className="inline-flex items-center bg-blue-50 rounded">
                <FileText size={14} className="text-blue-600 m-1.5" />
                <span className="text-xs text-blue-600 mr-1.5">Ticket ID</span>
              </div>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Metformin Extended Release Oral Tablets"
                className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded"
              />
            </div>
            <div className="ml-auto px-4 flex items-center space-x-4">
              <button className="text-gray-400">
                <Copy size={18} />
              </button>
              <button onClick={closeModal} className="text-gray-400">
                <X size={18} />
              </button>
              <button className="text-gray-400">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>


          {/* Main Content */}
          <div className="flex flex-col h-[calc(100vh-48px)]">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="grid grid-cols-2 gap-16">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ANALYST</label>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs">SP</span>
                    </div>
                    <select className="text-sm border-0 bg-transparent pl-2 pr-8 py-0.5">
                      <option>Sun Pharmaceutical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ACCOUNT MANAGER</label>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs">SP</span>
                    </div>
                    <select className="text-sm border-0 bg-transparent pl-2 pr-8 py-0.5">
                      <option>Sun Pharmaceutical</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">STATUS</label>
                  <select className="h-9 px-3 text-sm rounded bg-yellow-50 text-yellow-800 border-0">
                    <option>Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">STAGE</label>
                  <select className="h-9 px-3 text-sm border border-gray-200 rounded">
                    <option>Supplier Review</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-12 flex-1">
              {/* Left Section - 6 columns */}
              <div className="col-span-6  ">
                {/* Editor */}
                <div className="p-4">
                  <ReactQuill
                    value={newTask.description}
                    onChange={(content) => setNewTask({ ...newTask, description: content })}
                    placeholder="Add Description"
                    className="h-[500px]"
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        ['link'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['clean']
                      ]
                    }}
                  />
                </div>

                {/* Source Section */}
                <div className="p-4 mt-4 ">
                  <h3 className="text-sm font-medium mb-4 border-b border-gray-300 pb-2">SECTION NAME</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">SOURCE</label>
                      <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded mb-2">
                        <option>NC New</option>
                      </select>
                      <div className="flex gap-6">
                        <label className="flex items-center">
                          <input type="radio" name="source" className="w-4 h-4 text-purple-600 border-gray-300" />
                          <span className="ml-2 text-sm">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="source" className="w-4 h-4 text-purple-600 border-gray-300" />
                          <span className="ml-2 text-sm">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">STRATEGY</label>
                      <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded mb-2">
                        <option>Direct</option>
                      </select>
                      <div className="flex gap-6">
                        <label className="flex items-center">
                          <input type="radio" name="strategy" className="w-4 h-4 text-purple-600 border-gray-300" />
                          <span className="ml-2 text-sm">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="strategy" className="w-4 h-4 text-purple-600 border-gray-300" />
                          <span className="ml-2 text-sm">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">AGENCY</label>
                      <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded">
                        <option>VA, DOD, I.H.S., BOP</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">NAD WAIVER</label>
                      <button className="text-purple-600 text-sm">View Details ›</button>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">SITE TRANSFER</label>
                      <button className="text-purple-600 text-sm">View Details ›</button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-sm font-medium mb-4">PARTNERS</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">PRIMARY PARTNER</label>
                        <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded">
                          <option>Partner Uno</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">BACKUP PARTNER 1</label>
                        <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded">
                          <option>Partner Dos</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">BACKUP PARTNER 2</label>
                        <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded">
                          <option>Partner Tres</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Middle Section - 2 columns */}
              <div className="col-span-2 border-b  border-gray-200 p-4">
                <h3 className="text-sm font-medium mb-4 border-b border-gray-300 pb-2">SECTION NAME</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">ESTIMATED ANNUAL REVENUE</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="text"
                        value="23,121,000"
                        className="w-full h-9 pl-7 pr-3 text-sm border border-gray-200 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">ESTIMATED ANNUAL GP</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="text"
                        value="8,092,350"
                        className="w-full h-9 pl-7 pr-3 text-sm border border-gray-200 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">EXPECTED LAUNCH DATE</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="dd/mm/yyyy"
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded pr-9"
                      />
                      <button className="absolute right-3 top-2.5 text-gray-400">
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">CONCEPTS</h4>
                    <div className="flex gap-2">
                      <button className="h-7 px-3 bg-purple-50 text-purple-600 text-sm rounded hover:bg-purple-100">
                        500 MG
                      </button>
                      <button className="h-7 px-3 bg-purple-50 text-purple-600 text-sm rounded hover:bg-purple-100">
                        750 MG
                      </button>
                      <button className="text-gray-400 text-lg">+</button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">PACKAGE SIZES</h4>
                      <button className="text-purple-600 text-sm">+ Add package size</button>
                    </div>
                    <div className="flex gap-2">
                      <span className="h-7 px-3 bg-purple-50 text-purple-600 text-sm rounded">30</span>
                      <span className="h-7 px-3 bg-purple-50 text-purple-600 text-sm rounded">60</span>
                      <span className="h-7 px-3 bg-purple-50 text-purple-600 text-sm rounded">90</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4 - 2 columns */}
              <div className="col-span-2 border-b  border-gray-200 p-4">
                <h3 className="text-sm font-medium mb-4 border-b border-gray-300 pb-2">SECTION NAME</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">NG BID STATUS</label>
                    <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded">
                      <option>Solicitation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">AWARDING AGENCY</label>
                    <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded">
                      <option>Dept. Veterans Affairs</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">REVERSE AUCTION</label>
                    <div className="flex gap-6">
                      <label className="flex items-center">
                        <input type="radio" name="auction" className="w-4 h-4 text-purple-600 border-gray-300" />
                        <span className="ml-2 text-sm">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="auction" className="w-4 h-4 text-purple-600 border-gray-300" />
                        <span className="ml-2 text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">NEGOTIATION</label>
                    <div className="flex gap-6">
                      <label className="flex items-center">
                        <input type="radio" name="negotiation" className="w-4 h-4 text-purple-600 border-gray-300" />
                        <span className="ml-2 text-sm">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="negotiation" className="w-4 h-4 text-purple-600 border-gray-300" />
                        <span className="ml-2 text-sm">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5 - 1 column */}
              <div className="col-span-1 border-b  border-gray-200 p-4 mt-11">
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">SOLICITATION NUMBER</label>
                    <input
                      type="text"
                      value="36E79722R0041"
                      className="w-full h-9 px-3 text-sm border border-gray-200 rounded"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">NEGOTIATIONS DATE</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="dd/mm/yyyy"
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded pr-9"
                      />
                      <button className="absolute right-3 top-2.5 text-gray-400">
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">AWARD DATE</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="dd/mm/yyyy"
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded pr-9"
                      />
                      <button className="absolute right-3 top-2.5 text-gray-400">
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">AWARDED VALUE</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="text"
                        value="21,100,000"
                        className="w-full h-9 pl-7 pr-3 text-sm border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6 - 1 column */}
              <div className="col-span-1  p-4 mt-11">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">SUBMISSION DUE DATE</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="dd/mm/yyyy"
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded pr-9"
                      />
                      <button className="absolute right-3 top-2.5 text-gray-400">
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">FPR DATE</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="dd/mm/yyyy"
                        className="w-full h-9 px-3 text-sm border border-gray-200 rounded pr-9"
                      />
                      <button className="absolute right-3 top-2.5 text-gray-400">
                        <Calendar size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">AWARDEE</label>
                    <select className="w-full h-9 px-3 text-sm border border-gray-200 rounded">
                      <option>GSMS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">GSMS BID VALUE</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="text"
                        value="21,100,000"
                        className="w-full h-9 pl-7 pr-3 text-sm border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiKanbanBoard;