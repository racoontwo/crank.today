import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Coffee, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Donate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDonate = async (amount: number) => {
    setLoading(true);
    try {
      // This will be implemented with Stripe payment link
      toast({
        title: "Thank you!",
        description: "Redirecting to payment...",
      });
      
      // TODO: Implement Stripe payment redirect
      console.log(`Donating $${amount}`);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Main card */}
        <Card className="p-12 border border-border/30 bg-background">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-foreground/5 mb-6">
              <Coffee className="w-10 h-10 opacity-60" />
            </div>
            <h1 className="text-3xl font-light mb-4 tracking-tight">
              Buy Me a Coffee
            </h1>
            <p className="text-sm font-light opacity-60 max-w-md mx-auto leading-relaxed">
              If you find this app useful, consider supporting its development with a coffee.
              Your support helps keep this project alive and growing.
            </p>
          </div>

          {/* Donation options */}
          <div className="grid gap-4 max-w-md mx-auto">
            <button
              onClick={() => handleDonate(3)}
              disabled={loading}
              className="group w-full p-6 border border-border/30 rounded-lg hover:border-foreground/50 transition-all duration-300 text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-light mb-1">Small Coffee</div>
                  <div className="text-xs opacity-40 font-light">A token of appreciation</div>
                </div>
                <div className="text-2xl font-light opacity-60 group-hover:opacity-100 transition-opacity">
                  $3
                </div>
              </div>
            </button>

            <button
              onClick={() => handleDonate(5)}
              disabled={loading}
              className="group w-full p-6 border border-border/50 rounded-lg hover:border-foreground transition-all duration-300 text-left disabled:opacity-50 bg-foreground/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-light mb-1">Regular Coffee</div>
                  <div className="text-xs opacity-40 font-light">The perfect amount</div>
                </div>
                <div className="text-2xl font-light opacity-80 group-hover:opacity-100 transition-opacity">
                  $5
                </div>
              </div>
            </button>

            <button
              onClick={() => handleDonate(10)}
              disabled={loading}
              className="group w-full p-6 border border-border/30 rounded-lg hover:border-foreground/50 transition-all duration-300 text-left disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-light mb-1">Large Coffee</div>
                  <div className="text-xs opacity-40 font-light">Extra generous support</div>
                </div>
                <div className="text-2xl font-light opacity-60 group-hover:opacity-100 transition-opacity">
                  $10
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center mt-8">
              <Loader2 className="w-5 h-5 animate-spin opacity-60" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Donate;
