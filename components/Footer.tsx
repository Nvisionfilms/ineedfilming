import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Instagram, Youtube, ExternalLink } from "lucide-react";
import logo from "@/assets/nvlogo.png";

const Footer = () => {
  return (
    <footer className="bg-card/30 backdrop-blur-sm border-t border-border/30">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="NVision Films Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold">NVision Films</span>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Helping founders turn their story into strategy through authentic content creation.
            </p>
          </div>
          
          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base md:text-lg">Get In Touch</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => window.location.href = 'mailto:contact@nvisionfilms.com'}
              >
                <Mail className="w-4 h-4 mr-2" />
                contact@nvisionfilms.com
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground"
                onClick={() => document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Book Free Strategy Session
              </Button>
            </div>
          </div>
          
          {/* Social */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base md:text-lg">Follow Our Work</h3>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary"
                onClick={() => window.open('https://www.instagram.com/nvisionfilms', '_blank')}
              >
                <Instagram className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary"
                onClick={() => window.open('https://www.youtube.com/nvisionmg', '_blank')}
              >
                <Youtube className="w-5 h-5" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              See our latest work and behind-the-scenes content
            </p>
          </div>
        </div>
        
        <Separator className="my-6 md:my-8 bg-border/30" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
          <p>© 2024 NVision Films. All rights reserved.</p>
          <div className="flex gap-4 md:gap-6">
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-muted-foreground hover:text-foreground"
              onClick={() => window.open('https://www.nvisionfilms.com', '_blank')}
            >
              Main Website
            </Button>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = 'mailto:contact@nvisionfilms.com?subject=Privacy Policy Inquiry'}
            >
              Privacy Policy
            </Button>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/admin/login'}
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;