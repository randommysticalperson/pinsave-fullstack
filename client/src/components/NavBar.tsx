import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useNear } from "@/contexts/NearContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ImageIcon,
  UploadIcon,
  BookmarkIcon,
  SettingsIcon,
  MenuIcon,
  WalletIcon,
  LogOutIcon,
  ChevronDownIcon,
  ZapIcon,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: ImageIcon },
  { href: "/upload", label: "Upload", icon: UploadIcon },
  { href: "/saved", label: "Saved", icon: BookmarkIcon },
];

function WalletButton() {
  const { accountId, isConnected, isLoading, connect, disconnect } = useNear();

  if (isLoading) {
    return (
      <div className="h-9 w-32 skeleton rounded-full" />
    );
  }

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        size="sm"
        className="btn-glow gap-2 rounded-full font-medium"
      >
        <WalletIcon className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  const shortId =
    accountId && accountId.length > 18
      ? accountId.slice(0, 8) + "…" + accountId.slice(-6)
      : accountId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 font-medium"
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          {shortId}
          <ChevronDownIcon className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">Connected as</p>
          <p className="text-sm font-medium truncate">{accountId}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/saved" className="cursor-pointer">
            <BookmarkIcon className="h-4 w-4 mr-2" />
            My Pins
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NavBar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container">
        <nav className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-primary text-primary-foreground">
              <ZapIcon className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              PinSave
              <span className="text-primary ml-1 text-sm font-sans font-medium">Near</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 rounded-full transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <WalletButton />

            {/* Settings icon — desktop */}
            <Link href="/settings" className="hidden md:flex">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground"
                title="Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </Link>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-full"
                >
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 glass border-border/50">
                <div className="flex flex-col gap-2 mt-8">
                  {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                    const active = location === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className={`w-full justify-start gap-3 rounded-xl text-base ${
                            active
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {label}
                        </Button>
                      </Link>
                    );
                  })}
                  <Link href="/settings" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 rounded-xl text-base text-muted-foreground"
                    >
                      <SettingsIcon className="h-5 w-5" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
