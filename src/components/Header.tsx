import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Camera, Upload, Images, Settings, ChevronDown, Menu, X, FileText, Target, FolderOpen, Tag, User, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const isGalleryActive = location.pathname === "/gallery";
  const isUploadActive = location.pathname === "/upload";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <Camera className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EE Gallery</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {/* Gallery Link */}
            <Button
              variant={isGalleryActive ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "flex items-center space-x-2",
                isGalleryActive && "bg-primary text-primary-foreground"
              )}
            >
              <Link to="/gallery">
                <Images className="h-4 w-4" />
                <span>Gallery</span>
              </Link>
            </Button>

            {/* Upload Link - Only show if authenticated */}
            {user && (
              <Button
                variant={isUploadActive ? "default" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "flex items-center space-x-2",
                  isUploadActive && "bg-primary text-primary-foreground"
                )}
              >
                <Link to="/upload">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Link>
              </Button>
            )}

            {/* Manage Dropdown - Only show if authenticated */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Settings className="h-4 w-4" />
                    <span>Manage</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/articles" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Articles</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subject-areas" className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Subject Areas</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/categories" className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>Categories</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tags" className="flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>Tags</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Auth Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{user ? user.email?.split('@')[0] : 'Account'}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <DropdownMenuItem disabled>
                      <User className="h-4 w-4 mr-2" />
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="flex items-center space-x-2">
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-1 py-4">
              {/* Gallery Link */}
              <Button
                variant={isGalleryActive ? "default" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "justify-start",
                  isGalleryActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link to="/gallery" className="flex items-center space-x-2">
                  <Images className="h-4 w-4" />
                  <span>Gallery</span>
                </Link>
              </Button>

              {/* Upload Link - Only show if authenticated */}
              {user && (
                <Button
                  variant={isUploadActive ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className={cn(
                    "justify-start",
                    isUploadActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to="/upload" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </Link>
                </Button>
              )}

              {/* Manage Section - Only show if authenticated */}
              {user && (
                <div className="pt-2 border-t">
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                    Manage
                  </div>
                  <div className="space-y-1 pl-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="justify-start w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/articles" className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Articles</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="justify-start w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/subject-areas" className="flex items-center space-x-2">
                        <Target className="h-4 w-4" />
                        <span>Subject Areas</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="justify-start w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/categories" className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>Categories</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="justify-start w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/tags" className="flex items-center space-x-2">
                        <Tag className="h-4 w-4" />
                        <span>Tags</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Account Section */}
              <div className="pt-2 border-t">
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  Account
                </div>
                <div className="space-y-1 pl-4">
                  {user ? (
                    <>
                      <div className="px-3 py-2 text-sm text-muted-foreground flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start w-full text-destructive hover:text-destructive"
                        onClick={() => {
                          signOut();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Sign Out</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="justify-start w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/auth" className="flex items-center space-x-2">
                        <LogIn className="h-4 w-4" />
                        <span>Sign In</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};