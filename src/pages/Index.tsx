import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineScrollbar } from "@/components/TimelineScrollbar";
import { Trash2, Copy, Check, GripVertical, Mic, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyNote {
  date: string;
  todos: Todo[];
}

interface CompletedTodo {
  id: string;
  text: string;
  completedAt: string;
  completedDate: string;
}

interface SortableTodoItemProps {
  todo: Todo;
  index: number;
  isToday: boolean;
  copiedTodoId: string | null;
  editingTodoId: string | null;
  editingText: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string, text: string) => void;
  onMouseLeave: () => void;
  onStartEdit: (id: string, text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingTextChange: (text: string) => void;
}

const SortableTodoItem = ({
  todo,
  index,
  isToday,
  copiedTodoId,
  editingTodoId,
  editingText,
  onToggle,
  onDelete,
  onCopy,
  onMouseLeave,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingTextChange,
}: SortableTodoItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: !isToday });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 py-3 border-b border-border/30 group transition-all duration-300 hover:border-border"
      onMouseLeave={onMouseLeave}
    >
      {isToday && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity duration-200"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <Checkbox
        id={todo.id}
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        disabled={!isToday}
        className="border-foreground/30 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
      />
      {editingTodoId === todo.id ? (
        <Input
          value={editingText}
          onChange={(e) => onEditingTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveEdit();
            } else if (e.key === 'Escape') {
              onCancelEdit();
            }
          }}
          onBlur={onSaveEdit}
          autoFocus
          className="flex-1 text-base font-light border-0 border-b border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground transition-colors py-0 h-auto rounded-none px-0"
        />
      ) : (
        <div
          onClick={() => isToday && onStartEdit(todo.id, todo.text)}
          className={`flex-1 text-base font-light transition-all duration-300 ${
            isToday ? "cursor-text" : "cursor-default"
          } ${
            todo.completed
              ? "line-through opacity-40"
              : "opacity-80 group-hover:opacity-100"
          }`}
        >
          {todo.text}
        </div>
      )}
      <div className="relative">
        <button
          onClick={() => onCopy(todo.id, todo.text)}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity duration-200"
          aria-label="Copy task"
        >
          {copiedTodoId === todo.id ? (
            <Check className="w-4 h-4 animate-scale-in" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        {copiedTodoId === todo.id && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground/80 text-background px-2 py-1 rounded text-xs whitespace-nowrap animate-fade-in">
            Copied
          </div>
        )}
      </div>
      {isToday && (
        <button
          onClick={() => onDelete(todo.id)}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity duration-200"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDateDisplay = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  
  if (dateToCheck.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateToCheck.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

const Index = () => {
  const { toast } = useToast();
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [inputValue, setInputValue] = useState("");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [copiedTodoId, setCopiedTodoId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [completedHistory, setCompletedHistory] = useState<CompletedTodo[]>([]);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('timeMachineTodos');
    const storedCompleted = localStorage.getItem('completedTodosHistory');
    
    if (storedCompleted) {
      setCompletedHistory(JSON.parse(storedCompleted));
    }
    
    if (stored) {
      const parsed = JSON.parse(stored);
      setDailyNotes(parsed);
      
      const todayIndex = parsed.findIndex((note: DailyNote) => note.date === currentDate);
      if (todayIndex !== -1) {
        setCurrentDayIndex(todayIndex);
      } else {
        const newNote: DailyNote = { date: currentDate, todos: [] };
        setDailyNotes([newNote, ...parsed]);
        setCurrentDayIndex(0);
      }
    } else {
      const newNote: DailyNote = { date: currentDate, todos: [] };
      setDailyNotes([newNote]);
      setCurrentDayIndex(0);
    }
  }, []);

  // Save to localStorage whenever dailyNotes changes
  useEffect(() => {
    if (dailyNotes.length > 0) {
      localStorage.setItem('timeMachineTodos', JSON.stringify(dailyNotes));
    }
  }, [dailyNotes]);

  // Check for day change
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = formatDate(new Date());
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        const newNote: DailyNote = { date: newDate, todos: [] };
        setDailyNotes(prev => [newNote, ...prev]);
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentDayIndex(0);
          setIsAnimating(false);
        }, 800);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentDate]);

  const handleAddTodo = () => {
    if (!inputValue.trim() || currentDayIndex !== 0) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false
    };

    setDailyNotes(prev => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        todos: [...updated[0].todos, newTodo]
      };
      return updated;
    });

    setInputValue("");
  };

  const handleToggleTodo = (todoId: string) => {
    if (currentDayIndex !== 0) return; // Only allow toggling on today

    setDailyNotes(prev => {
      const updated = [...prev];
      const todo = updated[currentDayIndex].todos.find(t => t.id === todoId);
      
      if (todo && !todo.completed) {
        // Save to completed history
        const completedTodo: CompletedTodo = {
          id: todoId,
          text: todo.text,
          completedAt: new Date().toISOString(),
          completedDate: currentDate,
        };
        
        setCompletedHistory(prevHistory => {
          const newHistory = [completedTodo, ...prevHistory];
          localStorage.setItem('completedTodosHistory', JSON.stringify(newHistory));
          return newHistory;
        });
      }
      
      updated[currentDayIndex] = {
        ...updated[currentDayIndex],
        todos: updated[currentDayIndex].todos.map(todo =>
          todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        )
      };
      return updated;
    });
  };

  const handleDeleteTodo = (todoId: string) => {
    if (currentDayIndex !== 0) return; // Only allow deleting on today

    setDailyNotes(prev => {
      const updated = [...prev];
      updated[currentDayIndex] = {
        ...updated[currentDayIndex],
        todos: updated[currentDayIndex].todos.filter(todo => todo.id !== todoId)
      };
      return updated;
    });
  };

  const handleCopyTodo = (todoId: string, todoText: string) => {
    navigator.clipboard.writeText(todoText);
    setCopiedTodoId(todoId);
  };

  const handleTodoMouseLeave = () => {
    setCopiedTodoId(null);
  };

  const handleStartEdit = (todoId: string, currentText: string) => {
    if (currentDayIndex !== 0) return; // Only allow editing on today
    setEditingTodoId(todoId);
    setEditingText(currentText);
  };

  const handleSaveEdit = () => {
    if (!editingTodoId || !editingText.trim()) {
      setEditingTodoId(null);
      return;
    }

    setDailyNotes(prev => {
      const updated = [...prev];
      updated[currentDayIndex] = {
        ...updated[currentDayIndex],
        todos: updated[currentDayIndex].todos.map(todo =>
          todo.id === editingTodoId ? { ...todo, text: editingText.trim() } : todo
        )
      };
      return updated;
    });

    setEditingTodoId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditingText("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const currentDayTodos = dailyNotes[currentDayIndex].todos;
    const oldIndex = currentDayTodos.findIndex(todo => todo.id === active.id);
    const newIndex = currentDayTodos.findIndex(todo => todo.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTodos = arrayMove(currentDayTodos, oldIndex, newIndex);
      
      setDailyNotes(prev => {
        const updated = [...prev];
        updated[currentDayIndex] = {
          ...updated[currentDayIndex],
          todos: newTodos
        };
        return updated;
      });
    }
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not supported",
        description: "Voice recognition is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast({
        title: "Error",
        description: "Failed to recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleScroll = (e: React.WheelEvent) => {
    if (isAnimating) return;

    const delta = e.deltaY;
    const threshold = 50;

    if (Math.abs(delta) > threshold) {
      if (delta > 0 && currentDayIndex < dailyNotes.length - 1) {
        // Scroll down - go to previous day
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentDayIndex(prev => prev + 1);
          setIsAnimating(false);
        }, 400);
      } else if (delta < 0 && currentDayIndex > 0) {
        // Scroll up - go to next day (forward in time)
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentDayIndex(prev => prev - 1);
          setIsAnimating(false);
        }, 400);
      }
    }
  };

  const goToToday = () => {
    if (currentDayIndex === 0 || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentDayIndex(0);
      setIsAnimating(false);
    }, 600);
  };

  const navigateToDay = (index: number) => {
    if (index === currentDayIndex || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentDayIndex(index);
      setIsAnimating(false);
    }, 600);
  };

  const handleCopyUnfinishedTodos = () => {
    if (currentDayIndex === 0 || isAnimating) return;
    
    const unfinishedTodos = currentNote.todos.filter(todo => !todo.completed);
    
    if (unfinishedTodos.length > 0) {
      setDailyNotes(prev => {
        const updated = [...prev];
        const newTodos = unfinishedTodos.map(todo => ({
          ...todo,
          id: Date.now().toString() + Math.random(), // Generate new ID
          completed: false
        }));
        updated[0] = {
          ...updated[0],
          todos: [...updated[0].todos, ...newTodos]
        };
        return updated;
      });
    }
    
    // Navigate back to today
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentDayIndex(0);
      setIsAnimating(false);
    }, 600);
  };

  const currentNote = dailyNotes[currentDayIndex];
  const isToday = currentDayIndex === 0;

  return (
    <div 
      className="min-h-screen bg-background text-foreground overflow-hidden perspective-2000"
      onWheel={handleScroll}
      ref={containerRef}
    >
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-full max-w-2xl px-8 transform-style-3d flex items-center gap-12">
          {/* Main content area */}
          <div className="flex-1">
          {/* Date display */}
          <div 
            className="text-center mb-12 transition-all duration-700"
            style={{
              opacity: isAnimating ? 0.3 : 1,
              transform: `translateY(${isAnimating ? '-20px' : '0'})`
            }}
          >
            <h1 className="text-sm font-light tracking-widest uppercase opacity-60">
              {currentNote ? getDateDisplay(currentNote.date) : 'Today'}
            </h1>
          </div>

          {/* Main card */}
          <div 
            className="relative transition-all duration-700 ease-out transform-style-3d"
            style={{
              transform: `
                translateZ(${-currentDayIndex * 100}px) 
                rotateX(${currentDayIndex * 2}deg)
                scale(${1 - currentDayIndex * 0.05})
              `,
              opacity: 1 - currentDayIndex * 0.15,
              filter: currentDayIndex > 0 ? `blur(${currentDayIndex * 0.5}px)` : 'none'
            }}
          >
            {/* Input box */}
            {isToday && (
              <div className="mb-8 animate-fade-in relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTodo();
                    }
                  }}
                  placeholder="What needs to be done?"
                  className="w-full text-center border-0 border-b border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground transition-colors text-base font-light py-4 px-12 rounded-none"
                  disabled={!isToday}
                />
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
                    isRecording 
                      ? 'bg-red-500/20 text-red-500 animate-pulse' 
                      : 'opacity-40 hover:opacity-100 hover:bg-accent'
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Todo list */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={currentNote?.todos.map((todo) => todo.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {currentNote?.todos.map((todo, index) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      index={index}
                      isToday={isToday}
                      copiedTodoId={copiedTodoId}
                      editingTodoId={editingTodoId}
                      editingText={editingText}
                      onToggle={handleToggleTodo}
                      onDelete={handleDeleteTodo}
                      onCopy={handleCopyTodo}
                      onMouseLeave={handleTodoMouseLeave}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onEditingTextChange={setEditingText}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {currentNote?.todos.length === 0 && (
              <div className="text-center py-16 opacity-30">
                <p className="text-sm font-light">
                  {isToday ? 'Nothing yet. Type above to begin.' : 'No tasks this day.'}
                </p>
              </div>
            )}
          </div>
          </div>

          {/* Timeline Scrollbar */}
          {dailyNotes.length > 1 && (
            <div className="hidden md:block">
              <TimelineScrollbar
                totalDays={dailyNotes.length}
                currentIndex={currentDayIndex}
                onNavigate={navigateToDay}
                isAnimating={isAnimating}
              />
            </div>
          )}
        </div>
      </div>

      {/* Back to Today button */}
      {!isToday && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 animate-fade-in flex gap-3">
          <Button
            onClick={goToToday}
            variant="outline"
            className="border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-300 rounded-full px-8 py-2 text-xs font-light tracking-widest uppercase"
          >
            Back to Today
          </Button>
          <Button
            onClick={handleCopyUnfinishedTodos}
            variant="outline"
            className="border-foreground/20 hover:bg-foreground hover:text-background transition-all duration-300 rounded-full px-8 py-2 text-xs font-light tracking-widest uppercase"
          >
            Copy Unfinished
          </Button>
        </div>
      )}

      {/* Navigation hint */}
      {dailyNotes.length > 1 && (
        <div className="fixed bottom-12 right-12 text-xs font-light opacity-30 tracking-wide">
          Scroll to travel through time
        </div>
      )}

      {/* Completed Tasks Button */}
      <Dialog open={showCompletedDialog} onOpenChange={setShowCompletedDialog}>
        <DialogTrigger asChild>
          <button
            className="fixed bottom-12 left-12 p-3 rounded-full opacity-20 hover:opacity-100 transition-all duration-300 hover:bg-accent"
            aria-label="View completed tasks"
          >
            <Trophy className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">Your Achievements</DialogTitle>
            <DialogDescription className="font-light">
              All the tasks you've completed
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-4">
            {completedHistory.length === 0 ? (
              <div className="text-center py-16 opacity-30">
                <p className="text-sm font-light">No completed tasks yet. Keep going!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedHistory.map((task) => (
                  <div
                    key={task.id}
                    className="border-b border-border/30 pb-4 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <Check className="w-4 h-4 mt-1 text-foreground/60 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-base font-light">{task.text}</p>
                        <p className="text-xs opacity-40 mt-1 font-light">
                          Completed on {task.completedDate} at{" "}
                          {new Date(task.completedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
