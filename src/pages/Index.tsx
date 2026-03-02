import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Images, Camera, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
export default function Index() {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-16">
            <div className="flex justify-center mb-6">
              <Camera className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-slate-900">Explorable Explanations (EE) Gallery</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Upload, organize, and browse your images with ease. Add tags and descriptions to keep your gallery organized and searchable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {user ? <>
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/upload">
                      <Upload className="mr-2 h-5 w-5" />
                      Start Uploading
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8">
                    <Link to="/gallery">
                      <Images className="mr-2 h-5 w-5" />
                      Browse Gallery
                    </Link>
                  </Button>
                </> : <>
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link to="/auth">
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In to Upload
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-lg px-8">
                    <Link to="/gallery">
                      <Images className="mr-2 h-5 w-5" />
                      Browse Gallery
                    </Link>
                  </Button>
                </>}
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Easy Upload
                </CardTitle>
                <CardDescription>Upload images with drag & drop or file selection. Add titles, descriptions, and tags to organize your content. </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="p-0 h-auto">
                  <Link to="/upload" className="flex items-center gap-2 text-primary hover:text-primary/80">
                    Go to Upload <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-5 w-5 text-primary" />
                  Browse Gallery
                </CardTitle>
                <CardDescription>
                  View all your uploaded images in a beautiful grid layout. Filter by tags and search through your collection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="p-0 h-auto">
                  <Link to="/gallery" className="flex items-center gap-2 text-primary hover:text-primary/80">
                    View Gallery <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
}