
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile, Profile as ProfileType } from "@/services/userDataService";
import { getWorldCities } from "@/utils/geolocation";

const Profile = () => {
  const { toast } = useToast();
  const { profile, loading, error, updateProfile } = useUserProfile();
  const [formData, setFormData] = useState<Partial<ProfileType>>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    city: "",
    medical_history: "",
    allergies: "",
    medications: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: ""
  });
  
  // Get the list of world cities
  const worldCities = getWorldCities();
  
  useEffect(() => {
    if (profile) {
      console.log("Setting form data from profile:", profile);
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.region || "", // Use region data as city initially
        medical_history: profile.medical_history || "",
        allergies: profile.allergies || "",
        medications: profile.medications || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_relationship: profile.emergency_contact_relationship || "",
        emergency_contact_phone: profile.emergency_contact_phone || ""
      });
    } else {
      console.log("No profile data available");
    }
  }, [profile]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      console.log("Saving profile with data:", formData);
      
      // Map city back to region when saving to maintain compatibility with existing data structure
      const dataToSave = {
        ...formData,
        region: formData.city
      };
      
      await updateProfile(dataToSave);
      
      // Handle password change if provided
      if (passwordForm.password && passwordForm.password === passwordForm.confirmPassword) {
        // Password update logic would go here
        // Not implementing actual password change as it requires additional Supabase auth
        toast({
          title: "Password Change Not Implemented",
          description: "Password change functionality is not implemented in this demo"
        });
      } else if (passwordForm.password) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading your profile...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <Tabs defaultValue="personal">
        <TabsList className="mb-6">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={value => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select 
                    value={formData.city} 
                    onValueChange={value => setFormData(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {worldCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="password">Change Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.password}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Your health information helps doctors provide better care</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medical_history">Medical History</Label>
                <Textarea
                  id="medical_history"
                  name="medical_history"
                  placeholder="List any past surgeries, hospitalizations, or chronic conditions..."
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  placeholder="List any allergies to medications, foods, or other substances..."
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  name="medications"
                  placeholder="List any medications you're currently taking..."
                  value={formData.medications}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              <div className="bg-medical-blue/10 p-4 rounded-md">
                <p className="text-sm text-medical-neutral-dark">
                  Your medical information is protected and will only be shared with healthcare providers
                  you choose to consult with. You can update this information at any time.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>People to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Input
                    id="emergency_contact_relationship"
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Phone Number</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" disabled>
                  + Add Another Emergency Contact
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
