'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MainSidebar from '@/components/layout/MainSidebar';
import { Header } from '@/components/dashboard/header';

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
    },
    values: {
      fullName: profile?.full_name || '',
    },
  });
  
  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Update profile name in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.fullName, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Refresh profile in context
      await refreshProfile();
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }
  
  function handleSignOut() {
    signOut().catch((error) => {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    });
  }
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed top nav */}
      <div className="sticky top-0 bg-background w-full z-10">
        <div className="h-14">
          <Header title="Settings" />
        </div>
      </div>
      
      {/* Main content area - matches static-ads page layout */}
      <div className="flex flex-1 h-[calc(100vh-56px)]">
        {/* Sidebar - visible on sm screens and up */}
        {/* <div className="hidden sm:block w-64 shrink-0">
          <MainSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        </div> */}
        
        {/* Hamburger button for mobile - only visible on small screens */}
        <button
          type="button"
          aria-label="Open sidebar"
          className="fixed top-4 left-4 inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 z-20"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
          </svg>
        </button>
        
        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-8 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your public profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile && (
                <div>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                      <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is the name that will be displayed on your profile.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </Form>
                </div>
                )}
              </CardContent>
            </Card>
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Username</CardTitle>
                  <CardDescription>
                    Your unique username in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{profile?.username}</p>
                    <p className="text-sm text-muted-foreground">Cannot be changed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Address</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Managed by Google</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Authentication</p>
                      <p className="text-sm text-muted-foreground">Google Account</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Connected</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

