import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/learner/LearnerSidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Camera, User, Mail, Upload, Loader2, Edit, X } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const subjects = [
  "Programming",
  "Software Development",
  "Electronics",
  "Circuit Design",
  "Automotive",
  "Mechanical Systems",
  "Garments",
  "Fashion Design",
  "Industrial Design",
  "Manufacturing",
  "Quality Control",
  "Project Management",
];

export default function EditProfile() {
  const { user, role } = useUserRole();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [tutorInfo, setTutorInfo] = useState<any>(null);
  const [learnerInfo, setLearnerInfo] = useState<any>(null);
  const [subjectExpertise, setSubjectExpertise] = useState<string[]>([]);
  const [subjectsOfInterest, setSubjectsOfInterest] = useState<string[]>([]);
  const [loadingRoleData, setLoadingRoleData] = useState(true);
  
  // Store original values for cancel functionality
  const [originalValues, setOriginalValues] = useState<any>({});

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      // Load basic profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setFullName(profileData.full_name || "");
        setBio(profileData.bio || "");
        setAvatarUrl(profileData.avatar_url || "");
      }

      // Get email from auth
      setEmail(user.email || "");

      let tutorData = null;
      let learnerData = null;

      // Load role-specific data
      setLoadingRoleData(true);
      if (role === "tutor") {
        const { data, error } = await supabase
          .from("tutor_profiles")
          .select("subject_expertise, status")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          console.error("Error loading tutor profile:", error);
        }
        tutorData = data;
        setTutorInfo(tutorData || {});
        setSubjectExpertise(tutorData?.subject_expertise || []);
      } else if (role === "learner") {
        const { data, error } = await supabase
          .from("learner_profiles")
          .select("subjects_of_interest, registered_year")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          console.error("Error loading learner profile:", error);
        }
        learnerData = data;
        setLearnerInfo(learnerData || {});
        setSubjectsOfInterest(learnerData?.subjects_of_interest || []);
      }
      setLoadingRoleData(false);

      // Store original values
      setOriginalValues({
        fullName: profileData?.full_name || "",
        bio: profileData?.bio || "",
        avatarUrl: profileData?.avatar_url || "",
        subjectExpertise: tutorData?.subject_expertise || [],
        subjectsOfInterest: learnerData?.subjects_of_interest || [],
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      setLoadingRoleData(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = () => {
    // Store current values before editing
    setOriginalValues({
      fullName,
      bio,
      avatarUrl,
      subjectExpertise: [...subjectExpertise],
      subjectsOfInterest: [...subjectsOfInterest],
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Restore original values
    setFullName(originalValues.fullName);
    setBio(originalValues.bio);
    setAvatarUrl(originalValues.avatarUrl);
    setSubjectExpertise(originalValues.subjectExpertise || []);
    setSubjectsOfInterest(originalValues.subjectsOfInterest || []);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Update basic profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          avatar_url: avatarUrl,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update role-specific data
      if (role === "tutor") {
        const { error: tutorError } = await supabase
          .from("tutor_profiles")
          .update({
            subject_expertise: subjectExpertise,
          })
          .eq("user_id", user.id);

        if (tutorError) throw tutorError;
      } else if (role === "learner") {
        const { error: learnerError } = await supabase
          .from("learner_profiles")
          .update({
            subjects_of_interest: subjectsOfInterest,
          })
          .eq("user_id", user.id);

        if (learnerError) throw learnerError;
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Update original values with new saved values
      setOriginalValues({
        fullName,
        bio,
        avatarUrl,
        subjectExpertise: [...subjectExpertise],
        subjectsOfInterest: [...subjectsOfInterest],
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const getInitials = () => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case "admin": return "destructive";
      case "tutor": return "default";
      case "learner": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const Sidebar = role === "admin" ? AdminSidebar : role === "tutor" ? TutorSidebar : LearnerSidebar;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold">Profile</h1>
                <p className="text-xs text-muted-foreground">
                  {isEditing ? "Edit your profile information" : "View your profile"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 overflow-auto">
            <div className="space-y-6 max-w-[calc(100%-3rem)]">
              {/* Avatar Section */}
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative group">
                      <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                        <AvatarImage src={avatarUrl} alt={fullName} />
                        <AvatarFallback className="text-4xl font-semibold bg-gradient-to-br from-primary/20 to-primary/5">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <button
                          onClick={handleAvatarClick}
                          disabled={uploading}
                          className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Camera className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        <h2 className="text-2xl font-bold">{fullName || "Your Name"}</h2>
                        <Badge variant={getRoleBadgeColor()} className="capitalize">
                          {role}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{email}</span>
                      </div>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {bio || "No bio yet. Tell others about yourself!"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <CardTitle>Personal Information</CardTitle>
                    </div>
                    {!isEditing && (
                      <Button onClick={handleEdit} size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {isEditing ? "Update your personal details" : "Your profile information"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                      rows={4}
                      className="resize-none"
                      disabled={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">
                      {bio.length}/500 characters
                    </p>
                  </div>

                  {/* Role-Specific Information - Integrated */}
                  {role === "tutor" && (
                    <div className="space-y-4 pt-4 border-t">
                      {loadingRoleData ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading tutor information...</span>
                        </div>
                      ) : (
                        <>
                          {tutorInfo?.status && (
                            <div>
                              <Label>Status</Label>
                              <div className="mt-2">
                                <Badge variant={tutorInfo.status === "approved" ? "default" : "secondary"}>
                                  {tutorInfo.status}
                                </Badge>
                              </div>
                            </div>
                          )}
                          <div className="space-y-4">
                            <Label>Subject Expertise *</Label>
                            <p className="text-sm text-muted-foreground">Select the subjects you can teach</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {subjects.map((subject) => (
                                <div key={subject} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`tutor-${subject}`}
                                    checked={subjectExpertise?.includes(subject) || false}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSubjectExpertise([...subjectExpertise, subject]);
                                      } else {
                                        setSubjectExpertise(subjectExpertise.filter((s) => s !== subject));
                                      }
                                    }}
                                    disabled={!isEditing}
                                  />
                                  <label
                                    htmlFor={`tutor-${subject}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {subject}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Selected: {subjectExpertise.length} subject{subjectExpertise.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {role === "learner" && (
                    <div className="space-y-4 pt-4 border-t">
                      {loadingRoleData ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading learner information...</span>
                        </div>
                      ) : (
                        <>
                          {learnerInfo?.registered_year && (
                            <div>
                              <Label>Registered Year</Label>
                              <p className="mt-2 text-sm">{learnerInfo.registered_year}</p>
                            </div>
                          )}
                          <div className="space-y-4">
                            <Label>Subjects of Interest *</Label>
                            <p className="text-sm text-muted-foreground">Select the subjects you want to learn</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {subjects.map((subject) => (
                                <div key={subject} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`learner-${subject}`}
                                    checked={subjectsOfInterest?.includes(subject) || false}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSubjectsOfInterest([...subjectsOfInterest, subject]);
                                      } else {
                                        setSubjectsOfInterest(subjectsOfInterest.filter((s) => s !== subject));
                                      }
                                    }}
                                    disabled={!isEditing}
                                  />
                                  <label
                                    htmlFor={`learner-${subject}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {subject}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Selected: {subjectsOfInterest.length} subject{subjectsOfInterest.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSave} className="flex-1 md:flex-none">
                        <Upload className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancel}
                        className="flex-1 md:flex-none"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}