"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2, Lock, Mail, User, AlertCircle, CheckCircle2,
  ChevronLeft, Shield, Eye, EyeOff, Search, Trash2, Edit2, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/app/lib/api";

export default function RegisterPage() {
  const { user, registerUser } = useAuth();
  const router = useRouter();

  // Tabs & User Listing State
  const [activeTab, setActiveTab] = useState<"directory" | "register">("directory");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit/Delete Modal States
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);

  // Form states for Create User
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  // Form states for Edit User
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get("/auth/users");
      setUsersList(res.data);
    } catch (err: any) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/");
    } else if (user && user.role === "admin") {
      fetchUsers();
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield className="w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-muted-foreground max-w-xs">
            Only administrators can access user management.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setSuccess(`Account for ${formData.email} created successfully!`);
      setFormData({
        firstName: "", lastName: "", email: "",
        password: "", confirmPassword: "", role: "user"
      });
      fetchUsers();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to register user. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (targetUser: any) => {
    setEditingUser(targetUser);
    setEditFormData({
      firstName: targetUser.first_name,
      lastName: targetUser.last_name,
      email: targetUser.email,
      role: targetUser.role,
      password: "",
    });
    setShowEditPassword(false);
    setError(null);
    setSuccess(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const updatePayload: any = {
        first_name: editFormData.firstName,
        last_name: editFormData.lastName,
        email: editFormData.email,
        role: editFormData.role,
      };
      if (editFormData.password.trim() !== "") {
        if (editFormData.password.length < 8) {
          setError("New password must be at least 8 characters long.");
          setIsSubmitting(false);
          return;
        }
        updatePayload.password = editFormData.password;
      }

      await api.put(`/auth/users/${editingUser.id}`, updatePayload);
      setSuccess(`Account for ${editFormData.email} updated successfully!`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to update user. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (targetUser: any) => {
    if (targetUser.id === user.id) return;
    setDeletingUser(targetUser);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await api.delete(`/auth/users/${deletingUser.id}`);
      setSuccess(`Account deleted successfully!`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to delete user. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const email = u.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 pt-16 pb-12 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f630_1px,transparent_1px)] bg-[length:20px_20px] dark:bg-[radial-gradient(#3b82f610_1px,transparent_1px)]" />

      <div className={`mx-auto relative transition-all duration-300 ${activeTab === "directory" ? "max-w-5xl" : "max-w-2xl"}`}>
        <button
          onClick={() => router.push("/")}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm hover:shadow transition-all hover:-translate-x-0.5 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <Card className="border border-white/60 dark:border-zinc-800 shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl mt-8">
          {/* HEADER */}
          <div className="flex flex-col items-center pt-10 pb-2">
            <div className="relative w-40 h-14 mb-2">
              <Image
                src="/images/IFB.png"
                alt="IFB Logo"
                fill
                className="object-contain dark:invert"
                priority
              />
            </div>
            <p className="text-xs tracking-[3px] uppercase text-zinc-500 dark:text-zinc-400 font-medium">
              Materials • Inventory OS
            </p>
          </div>

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              {activeTab === "directory" ? "Manage Users" : "Create New User"}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {activeTab === "directory"
                ? "View, edit, and manage registered team member accounts"
                : "Add a new team member to the Materials Dashboard"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            {/* TAB SELECTOR */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("directory");
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px] mr-6 focus:outline-none cursor-pointer ${activeTab === "directory"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
              >
                User Directory ({usersList.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px] focus:outline-none cursor-pointer ${activeTab === "register"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
              >
                Create New User
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            {/* TAB CONTENT: DIRECTORY */}
            {activeTab === "directory" && (
              <div className="space-y-6">
                {/* SEARCH BAR */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading users list...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center p-6 bg-zinc-50/50 dark:bg-zinc-950/20 animate-in fade-in duration-300">
                    <User className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">No users found</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mt-1">
                      {searchQuery ? "Try refining your search query." : "Register a new user to see them here."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10 animate-in fade-in duration-300">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-semibold">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Registered Date</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="p-4 font-medium">
                              {u.first_name} {u.last_name}
                            </td>
                            <td className="p-4 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                            <td className="p-4">
                              <Badge
                                variant="secondary"
                                className={
                                  u.role === "admin"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-semibold rounded-lg px-2.5 py-1 border-transparent"
                                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 font-semibold rounded-lg px-2.5 py-1 border-transparent"
                                }
                              >
                                {u.role === "admin" ? "Admin" : "User"}
                              </Badge>
                            </td>
                            <td className="p-4 text-zinc-500 dark:text-zinc-400">
                              {new Date(u.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(u)}
                                className="w-8 h-8 rounded-full text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 cursor-pointer"
                                title="Edit User"
                              >
                                <Edit2 className="w-4.5 h-4.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(u)}
                                disabled={u.id === user.id}
                                className={`w-8 h-8 rounded-full cursor-pointer ${u.id === user.id
                                  ? "text-red-300 dark:text-red-600 cursor-not-allowed"
                                  : "text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                  }`}
                                title={u.id === user.id ? "You cannot delete yourself" : "Delete User"}
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CREATE USER FORM */}
            {activeTab === "register" && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
                {/* NAME FIELDS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="Urvesh"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        placeholder="Vernekar"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="urvesh_vernekar@ifbglobal.com"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-11 pr-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* PASSWORD STRENGTH */}
                  {formData.password && (
                    <div className="flex items-center gap-3 text-xs mt-2">
                      <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className={`font-medium ${passwordStrength.score >= 3 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-11 pr-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* PASSWORD MATCH CHECK */}
                  {formData.confirmPassword && (
                    <div className="flex items-center gap-2 text-xs mt-2 pl-1">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="font-medium text-red-600 dark:text-red-400">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ROLE SELECTION */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "user", label: "User", desc: "Standard access" },
                      { value: "admin", label: "Admin", desc: "Full access" },
                    ].map((r) => (
                      <label
                        key={r.value}
                        className={`cursor-pointer border rounded-2xl p-4 transition-all hover:border-blue-500 ${formData.role === r.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50'
                          : 'border-zinc-200 dark:border-zinc-800'
                          }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={formData.role === r.value}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className="font-semibold">{r.label}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{r.desc}</div>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 text-base font-semibold rounded-2xl mt-4 shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all active:scale-[0.985] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create User Account"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" onClick={() => setEditingUser(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-foreground">Edit User Profile</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setEditingUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                {/* NAME FIELDS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleEditChange}
                        className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleEditChange}
                        className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      className="w-full pl-11 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New Password (optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type={showEditPassword ? "text" : "password"}
                      name="password"
                      value={editFormData.password}
                      onChange={handleEditChange}
                      className="w-full pl-11 pr-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Leave blank to keep current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      {showEditPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* ROLE */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "user", label: "User", desc: "Standard access" },
                      { value: "admin", label: "Admin", desc: "Full access" },
                    ].map((r) => (
                      <label
                        key={r.value}
                        className={`cursor-pointer border rounded-2xl p-4 transition-all hover:border-blue-500 ${editFormData.role === r.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50'
                          : 'border-zinc-200 dark:border-zinc-800'
                          } ${editingUser.id === user.id ? 'opacity-60 cursor-not-allowed hover:border-zinc-200 dark:hover:border-zinc-800' : ''}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={editFormData.role === r.value}
                          onChange={handleEditChange}
                          disabled={editingUser.id === user.id}
                          className="hidden"
                        />
                        <div className="font-semibold">{r.label}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{r.desc}</div>
                      </label>
                    ))}
                  </div>
                  {editingUser.id === user.id && (
                    <p className="text-[11px] text-orange-600 dark:text-orange-400 italic mt-1 font-medium">
                      Note: You cannot demote yourself from Admin to User. Another admin must do this.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <Button type="button" variant="outline" className="rounded-xl cursor-pointer" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl cursor-pointer">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" onClick={() => setDeletingUser(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Delete User Account</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setDeletingUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">Warning: Permanent Action</p>
                  <p className="text-red-700 dark:text-red-400 mt-1">
                    Are you sure you want to permanently delete the account for:
                  </p>
                  <p className="font-bold text-zinc-900 dark:text-white mt-1">
                    {deletingUser.first_name} {deletingUser.last_name} ({deletingUser.email})
                  </p>
                  <p className="text-red-600 dark:text-red-400 mt-2 text-xs">
                    This user will immediately lose all access to the system. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <Button type="button" variant="outline" className="rounded-xl cursor-pointer" onClick={() => setDeletingUser(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isSubmitting}
                className="rounded-xl cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}