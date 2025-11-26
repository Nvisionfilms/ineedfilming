import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/nvlogo.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { label: "How It Works", href: "#process" },
    { label: "Services", href: "#services" },
    { label: "Results", href: "#results" },
    { label: "About", href: "https://www.nvisionfilms.com", external: true }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="NVision Films Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold">NVision Films</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              item.external ? (
                <a 
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <a 
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector(item.href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {item.label}
                </a>
              )
            ))}
          </div>
          
          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Free Strategy Session
            </Badge>
            <Button 
              variant="cta" 
              size="sm"
              onClick={() => {
                navigate('/#lead-capture');
                setTimeout(() => {
                  document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              Get Started
            </Button>
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/30">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) => (
                item.external ? (
                  <a 
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <a 
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      const element = document.querySelector(item.href);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 cursor-pointer"
                  >
                    {item.label}
                  </a>
                )
              ))}
              <div className="pt-4 border-t border-border/30 space-y-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 w-fit">
                  Free Strategy Session
                </Badge>
                <Button 
                  variant="cta" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/#lead-capture');
                    setTimeout(() => {
                      document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
