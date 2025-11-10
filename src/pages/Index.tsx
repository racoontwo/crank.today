import { useState, useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimelineScrollbar } from "@/components/TimelineScrollbar";
import { Trash2 } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface DailyNote {
  date: string;
  todos: Todo[];
}

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
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [inputValue, setInputValue] = useState("");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('timeMachineTodos');
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
              <div className="mb-8 animate-fade-in">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTodo();
                    }
                  }}
                  placeholder="What needs to be done?"
                  className="w-full text-center border-0 border-b border-border bg-transparent focus-visible:ring-0 focus-visible:border-foreground transition-colors text-base font-light py-4 rounded-none"
                  disabled={!isToday}
                />
              </div>
            )}

            {/* Todo list */}
            <div className="space-y-1">
              {currentNote?.todos.map((todo, index) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-4 py-3 border-b border-border/30 group transition-all duration-300 hover:border-border"
                  style={{
                    animation: `fade-in 0.4s ease-out ${index * 0.1}s both`
                  }}
                >
                  <Checkbox
                    id={todo.id}
                    checked={todo.completed}
                    onCheckedChange={() => handleToggleTodo(todo.id)}
                    disabled={!isToday}
                    className="border-foreground/30 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                  />
                  <label
                    htmlFor={todo.id}
                    className={`flex-1 text-base font-light cursor-pointer transition-all duration-300 ${
                      todo.completed 
                        ? 'line-through opacity-40' 
                        : 'opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {todo.text}
                  </label>
                  {isToday && (
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity duration-200"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

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
