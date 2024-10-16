import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "react-toastify";
import { UUID } from "crypto";
import { showErrorMessage } from "@/utils/showMessageError";
import { authorized } from "@/enum/errorCode";
import { useTranslation } from "../../../i18n";
import { MyInfoProps } from "@/app/types/UserDetail";

interface CreateOrderModalProps {
  onClose: () => void;
  onCreate: (newOrder: Order) => void;
}

interface Order {}
const CreateOrderModal = ({ onClose, onCreate }: CreateOrderModalProps) => {};
export default CreateOrderModal;
