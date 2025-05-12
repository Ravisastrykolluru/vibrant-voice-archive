
import React, { useState } from "react";
import { Trash2, Upload, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Language {
  id: string;
  name: string;
  sentences: string[];
  uploadDate: string;
}

interface AdminLanguageManagerProps {
  languages: any[];
  onDelete: (id: string) => void;
  onLanguageAdded: () => void;
}

const AdminLanguageManager: React.FC<AdminLanguageManagerProps> = ({ 
  languages, 
  onDelete,
  onLanguageAdded
}) => {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [languageName, setLanguageName] = useState("");
  const [fileFormat, setFileFormat] = useState<"txt" | "csv">("txt");
  const [textFormat, setTextFormat] = useState<"single" | "paragraph">("single");
  const [file, setFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !languageName) {
      toast({
        title: "Missing information",
        description: "Please provide a language name and select a file",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const text = await file.text();
      let sentences: string[] = [];
      
      if (textFormat === "single") {
        // Split by line breaks
        sentences = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      } else {
        // Split by periods for paragraph format
        sentences = text
          .split(".")
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => s + ".");
      }
      
      if (sentences.length === 0) {
        toast({
          title: "No sentences found",
          description: "The file doesn't contain any valid sentences",
          variant: "destructive"
        });
        return;
      }
      
      // Create a new language entry directly in Supabase
      const newLanguage = {
        id: Date.now().toString(),
        name: languageName,
        sentences,
        upload_date: new Date().toISOString()
      };
      
      // Save the language to Supabase
      const { error } = await supabase
        .from('languages')
        .insert(newLanguage);
        
      if (error) {
        console.error("Error saving language:", error);
        toast({
          title: "Upload failed",
          description: "Could not save the language to the database",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Language added",
        description: `Added ${sentences.length} sentences for ${languageName}`
      });
      
      // Reset form
      setLanguageName("");
      setFile(null);
      setIsUploadDialogOpen(false);
      onLanguageAdded();
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not process the file",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Language Management</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus size={18} className="mr-2" /> Add New Language
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Language File</DialogTitle>
              <DialogDescription>
                Upload a text file containing sentences for the new language.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="languageName">Language Name</Label>
                <Input 
                  id="languageName" 
                  value={languageName} 
                  onChange={(e) => setLanguageName(e.target.value)} 
                  placeholder="e.g., English, Spanish, Hindi" 
                />
              </div>
              
              <div className="space-y-2">
                <Label>File Format</Label>
                <RadioGroup value={fileFormat} onValueChange={(value) => setFileFormat(value as "txt" | "csv")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="txt" id="txt" />
                    <Label htmlFor="txt">TXT</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv">CSV</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Text Format</Label>
                <RadioGroup value={textFormat} onValueChange={(value) => setTextFormat(value as "single" | "paragraph")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">One sentence per line</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paragraph" id="paragraph" />
                    <Label htmlFor="paragraph">Full paragraph (split by periods)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept={fileFormat === "txt" ? ".txt" : ".csv"} 
                  onChange={handleFileChange} 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>
                Upload and Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {languages.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Language</TableHead>
              <TableHead>Sentences</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languages.map(language => (
              <TableRow key={language.id}>
                <TableCell className="font-medium">{language.name}</TableCell>
                <TableCell>{language.sentences.length}</TableCell>
                <TableCell>{new Date(language.upload_date || language.uploadDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(language.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No languages added yet</p>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload size={18} className="mr-2" /> Upload Language File
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AdminLanguageManager;
