"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import UserList from "@/components/Admin/doctor/DoctorList";
import CreateUserButton from "@/components/Admin/user/CreateUserButton";
import { useUser } from "@/context/UserContext";
import { fetchAccounts } from "@/services/apiService";
import DeleteUserButton from "@/components/Admin/user/DeleteUserButton";
import AppLayout from "@/components/AppLayout";
import { PERMISSIONS } from "@/utils/constant";
import { toast } from "react-toastify";
import CreateRoleButton from "@/components/Admin/role/CreateRoleButton";