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
import logo from "@/assets/logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { DonationQRManager } from "@/components/tutor/DonationQRManager";

// Helper function to count words
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

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
  const { user, role, loading: roleLoading } = useUserRole();
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
  const [tutorStatus, setTutorStatus] = useState<string>("");
  const [loadingRoleData, setLoadingRoleData] = useState(true);
  const [donationQRCode, setDonationQRCode] = useState<string>("");
  
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
          .select("subject_expertise, status, donation_qr_code")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          console.error("Error loading tutor profile:", error);
          console.error("Error details:", error.message, error.details, error.hint);
        } else {
          console.log("Loaded tutor data:", data);
        }
        tutorData = data;
        setTutorInfo(tutorData || {});
        setTutorStatus(tutorData?.status || "");
        setDonationQRCode(tutorData?.donation_qr_code || "");
        const expertise = Array.isArray(tutorData?.subject_expertise) ? tutorData.subject_expertise : [];
        setSubjectExpertise(expertise);
        console.log("Set subject expertise:", expertise);
      } else if (role === "learner") {
        const { data, error } = await supabase
          .from("learner_profiles")
          .select("subjects_of_interest, registered_year")
          .eq("user_id", user.id)
          .single();
        
        if (error) {
          console.error("Error loading learner profile:", error);
          console.error("Error details:", error.message, error.details, error.hint);
        } else {
          console.log("Loaded learner data:", data);
        }
        learnerData = data;
        setLearnerInfo(learnerData || {});
        const interests = Array.isArray(learnerData?.subjects_of_interest) ? learnerData.subjects_of_interest : [];
        setSubjectsOfInterest(interests);
        console.log("Set subjects of interest:", interests);
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

    // Validate bio word count
    const wordCount = countWords(bio);
    if (wordCount > 500) {
      toast.error(`Bio must be 500 words or less (currently ${wordCount} words)`);
      return;
    }
    
    if (wordCount < 10 && bio.trim().length > 0) {
      toast.error("Bio must be at least 10 words");
      return;
    }

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
            bio: bio, // Also update bio in tutor_profiles
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
      
      // Reload profile data from database to ensure UI is in sync
      await loadProfile();
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

  // Determine which sidebar to use based on role (uses cached role for instant loading)
  const Sidebar = role === "admin" ? AdminSidebar : role === "tutor" ? TutorSidebar : LearnerSidebar;

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="TechConnect Logo" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-lg hidden sm:inline">TechConnect</span>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <UserMenu />
                <SidebarTrigger className="md:hidden" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pt-8 pb-12 overflow-auto flex justify-center overflow-x-hidden">
            <div className="space-y-6 w-full max-w-sm md:max-w-5xl">
              <MaintenanceBanner />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Profile</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  View and edit your profile information
                </p>
              </div>

              <div className="pl-4 md:pl-0 space-y-6">
              {/* Avatar Section */}
              <Card className="border-2 w-full max-w-full overflow-hidden">
                <CardContent className="pt-6 px-4 md:px-6">
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
                      <h2 className="text-2xl font-bold">{fullName || "Your Name"}</h2>
                      <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                        <Badge variant={getRoleBadgeColor()} className="capitalize">
                          {role}
                        </Badge>
                        {role === "tutor" && tutorStatus && (
                          <Badge variant={
                            tutorStatus === "approved" ? "default" : 
                            tutorStatus === "pending" ? "secondary" : 
                            "destructive"
                          } className="capitalize">
                            {tutorStatus}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm break-all">{email}</span>
                      </div>
                      <p className="text-sm text-muted-foreground max-w-md line-clamp-3 break-words whitespace-pre-wrap overflow-wrap-anywhere">
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
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jomar Samsung"
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
                      className="resize-none min-h-[100px] max-h-[200px] overflow-y-auto custom-scrollbar break-words overflow-wrap-anywhere"
                      disabled={!isEditing}
                    />
                    <p className={`text-xs ${countWords(bio) >= 500 ? 'text-destructive' : countWords(bio) > 450 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {countWords(bio)}/500 words
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
                </CardContent>
              </Card>

              {/* Donation QR Code Section - Tutors Only */}
              {role === "tutor" && user && (
                <DonationQRManager
                  userId={user.id}
                  currentQRCode={donationQRCode}
                  onUpdate={setDonationQRCode}
                />
              )}

              <Card className="border-2 w-full max-w-full overflow-hidden">
                <CardContent className="pt-6 px-4 md:px-6">
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}