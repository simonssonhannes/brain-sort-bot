import { useState, useCallback } from "react";
import { pipeline } from "@huggingface/transformers";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ClassificationResult {
  label: string;
  score: number;
}

export const MushroomClassifier = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const { toast } = useToast();

  const classifyImage = useCallback(async (imageUrl: string) => {
    setIsClassifying(true);
    setIsModelLoading(true);
    
    try {
      toast({
        title: "Loading AI Model",
        description: "Downloading classification model (first time only)...",
      });

      // Create the classifier pipeline with Transformers.js compatible model
      const classifier = await pipeline(
        "image-classification",
        "Xenova/vit-base-patch16-224"
      );

      setIsModelLoading(false);
      
      toast({
        title: "Analyzing Image",
        description: "Classifying your mushroom image...",
      });

      // Classify the image
      const output = await classifier(imageUrl, { top_k: 5 });
      
      setResults(output as ClassificationResult[]);
      
      toast({
        title: "Classification Complete!",
        description: "Results are ready",
      });
    } catch (error) {
      console.error("Classification error:", error);
      toast({
        title: "Classification Failed",
        description: error instanceof Error ? error.message : "An error occurred during classification",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setIsClassifying(false);
      setIsModelLoading(false);
    }
  }, [toast]);

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        setResults([]);
        classifyImage(imageUrl);
      };
      reader.readAsDataURL(file);
    },
    [classifyImage, toast]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please drop an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        setResults([]);
        classifyImage(imageUrl);
      };
      reader.readAsDataURL(file);
    },
    [classifyImage, toast]
  );

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)] py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-[var(--gradient-nature)] bg-clip-text text-transparent">
            🍄 Mushroom Classifier
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an image of a mushroom and let AI identify its species using advanced computer vision
          </p>
        </div>

        <Card className="p-8 shadow-[var(--shadow-strong)] border-2">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-border rounded-lg p-12 text-center transition-all duration-300 hover:border-primary hover:bg-primary/5"
          >
            {!selectedImage ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-6 bg-primary/10 rounded-full">
                    <Upload className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-medium">Drop your mushroom image here</p>
                  <p className="text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button variant="nature" size="lg" asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-5 w-5" />
                    Select Image
                  </label>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <img
                  src={selectedImage}
                  alt="Selected mushroom"
                  className="max-h-96 mx-auto rounded-lg shadow-[var(--shadow-strong)]"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-reupload"
                />
                <Button variant="outline" asChild>
                  <label htmlFor="image-reupload" className="cursor-pointer">
                    Upload Different Image
                  </label>
                </Button>
              </div>
            )}
          </div>
        </Card>

        {isClassifying && (
          <Card className="p-8 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">
                  {isModelLoading ? "Loading AI Model..." : "Analyzing Image..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isModelLoading ? "This may take a moment on first use" : "Please wait"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {results.length > 0 && !isClassifying && (
          <Card className="p-8 shadow-[var(--shadow-strong)] border-2 border-primary/20">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Classification Results</h2>
              </div>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary transition-all duration-300"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-lg">{result.label}</p>
                      <div className="mt-2 w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-[var(--gradient-nature)] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.score * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-2xl font-bold text-primary">
                        {(result.score * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">confidence</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This AI model provides general image classification. 
                  For accurate mushroom identification, please consult with a mycology expert, 
                  especially before consuming any mushroom.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
