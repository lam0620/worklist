"use client";
import { useTranslation } from "../../i18n/client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import "./ReportComponent.css";
import ReactToPrint from "react-to-print";
import Modal from "react-modal";
import dynamic from "next/dynamic";
import Utils from "../../utils/utils";
import * as Util from "../../utils/utils";
import Typography from "@/components/report/Typography";
import Button from "@/components/report/Button/Button";
import * as ButtonEnums from "@/components/report/Button/ButtonEnums";
import Select from "@/components/report/Select/Select";
import Dialog from "@/components/report/Dialog/Dialog";
import "../worklist-tmp/worklist.css";
import { useUser } from "@/context/UserContext";
import { PERMISSIONS } from "@/utils/constant";
import HeaderWorklist from "@/components/HeaderWorklist";
import { ClassicEditor } from "ckeditor5";
import {
  fetchRadiologists,
  createReport,
  updateReport,
  discardReport,
  fetchReportTemplates,
  createReportTemplate,
  fetchScanProtocols,
  fetchReportWorklist,
} from "@/services/apiService";
import "ckeditor5/ckeditor5.css";
import PDFComponent from "./PDF/PdfComponent";
const DynamicCustomEditor = dynamic(
  () => import("../../components/report/customEditor"),
  { ssr: false }
);
const ReportComponent = () => {
  const { t } = useTranslation("reportWorklist");
  // Create Document Component
  const editorContainerRef = useRef(null);
  const editorRef = useRef(null);
  const { user } = useUser();
  const CustomEditor = useMemo(() => DynamicCustomEditor, []); //use useMemo to prevent CKE from re-loading when data changes

  // Reference to editor data (findings)
  const editorFindingsRef = useRef<ClassicEditor | null>(null);
  const editorConclusionRef = useRef<ClassicEditor | null>(null);
  const editorProtocolRef = useRef<ClassicEditor | null>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [study_iuid, setStudyIuid] = useState<string | null>(null);
  const [proc_id, setProcId] = useState<string | null>(null);
  const [accession_no, setAccessionNo] = useState("<None>");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setAccessionNo(searchParams.get("acn") || "<None>");
      setStudyIuid(searchParams.get("StudyInstanceUIDs"));
      setProcId(searchParams.get("procid"));
    }
  }, []);
  const componentRef = useRef<HTMLDivElement | null>(null);
  const emptyReportData = {
    accession_no: "",
    referring_phys: {
      code: "",
      fullname: "",
    },
    clinical_diagnosis: "",
    created_time: "",

    modality_type: "",
    patient: {
      pid: "",
      fullname: "",
      gender: "",
      dob: "",
      tel: "",
      address: "",
      insurance_no: "",
    },
    report: {
      id: "",
      findings: "",
      conclusion: "",
      status: "",
      status_origin: "",
      scan_protocol_origin: "",
      scan_protocol: "",
      findings_origin: "",
      conclusion_origin: "",
      created_time: "",
    },
    procedure: {
      study_iuid: "",
      code: "",
      name: "",
    },
    radiologist: {
      doctor_no: "",
      fullname: "",
      title: "",
      sign: "",
      id: "",
    },
    resolve: (value: unknown) => {},
  };
  const emptyError = {
    error: {
      fatal: "",
      system: "",
      findings: "",
      conclusion: "",
      scan_protocol: "",
      radiologist: "",
    },
  };

  const [collapsed, setCollapsed] = useState(false);
  const [reportData, setReportData] = useState(emptyReportData);

  const [radiologistList, setRadiologistList] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [selectedRadiologist, setSelectedRadiologist] = useState<any>({
    value: "",
    label: t("-------- Select --------"),
  });

  const [procedureList, setProcedureList] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [selectedProcedure, setSelectedProcedure] = useState<any>({
    value: "",
    label: "",
  });

  // List orginal objects
  const [reportTemplateOriginList, setReportTemplateOriginList] = useState<any>(
    {}
  );
  // List id:label
  type OptionType = { value: string; label: string };
  const [reportTemplateList, setReportTemplateList] = useState<OptionType[]>(
    []
  );
  const [selectedReportTemplate, setSelectedReportTemplate] = useState<any>({
    value: "",
    label: t("----- Select template ----"),
  });

  // Scan protocol
  const [scanProtocolOriginList, setScanProtocolOriginList] = useState<any>({});
  const [selectedRadio, setSelectedRadio] = useState("");
  // List id:label
  const [scanProtocolList, setScanProtocolList] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [selectedScanProtocol, setSelectedScanProtocol] = useState<any>({
    value: "",
    label: t("----- Select protocol ----"),
  });

  const [printTemplateList, setPrintTemplateList] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [selectedPrintTemplate, setSelectedPrintTemplate] = useState<[]>([]);

  const [info, setInfo] = useState("");
  const [state, setState] = useState(emptyError);

  const [showElement, setShowElement] = useState(true);
  const [isConfirmShow, setIsConfirmShow] = useState(false);
  const [isDeleteConfirmShow, setIsDeleteConfirmShow] = useState(false);

  //Create dialog box, Use Modal lib to create a dialog box
  // Modal.setAppElement("#root");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportTemplateName, setReportTemplateName] = useState<any>("");

  //set error if report template name is empty at dialog
  const [errorMessage, setErrorMessage] = useState("");

  const hasAddReportPermission =
    user?.permissions?.includes(PERMISSIONS.ADD_REPORT) || user?.is_superuser;
  const hasEditReportPermission =
    user?.permissions?.includes(PERMISSIONS.EDIT_REPORT) || user?.is_superuser;
  const hasDeleteReportPermission =
    user?.permissions?.includes(PERMISSIONS.DELETE_REPORT) ||
    user?.is_superuser;

  /**
   * Get doctor by userId
   * A doctor has a login user account(user_id)
   * @param userId
   */
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        if (user?.is_superuser) {
          setInfo(t("You login with administrator privileges"));
        }
        // Get Order
        await getReport(proc_id);
        // Get list of radiologists
        getRadiologists();
        try {
          // Get from .env
          let printTemplates = JSON.parse(
            process.env.NEXT_PUBLIC_ORG_PRINT_TEMPLATE_LIST ?? ""
          );
          setPrintTemplateList(printTemplates);

          setSelectedPrintTemplate(printTemplates[0]);
        } catch (e) {
          console.log("Get print template failed", e);
        }
        setIsLayoutReady(true);
      }
    };
    fetchData();
    return () => setIsLayoutReady(false);
  }, [user, proc_id, isDeleteConfirmShow]);

  useEffect(() => {
    // Get report template
    if (reportData.modality_type) {
      getReportTemplates(reportData.modality_type);
      // Get Scan protocol
      getScanProtocols(reportData.modality_type);
    }
  }, [reportData.modality_type]);

  const getReport = async (proc_id: any) => {
    let error = { ...state.error };

    if (Util.isEmpty(proc_id)) {
      error.fatal = t("Incorrect data! Please close and open the report again");
      setState({ ...state, error });
      return;
    }
    try {
      const response = await fetchReportWorklist(proc_id);
      const response_data = response?.data;

      if (response_data.result.status === "NG") {
        error.fatal = response_data.result.msg;
        setState({ ...state, error });
      } else if (
        Util.isObjectEmpty(response_data.data) ||
        response_data.data.length === 0
      ) {
        setReportData(emptyReportData);
        error.fatal = t(
          "No appropriate Order found. Please contact your administrator and ensure HIS has already sent the order to PACS"
        );
        setState({ ...state, error });
      } else {
        let proceList: any[] = [];
        const data = response_data.data;
        let report = data;
        report.report.status_origin = report.report.status;
        setReportData(report);
        if (report.procedure.proc_id) {
          setSelectedProcedure({
            value: report.procedure.proc_id,
            label: report.procedure.name,
          });
        }
        if (report.radiologist.id) {
          const title = Util.isEmpty(report.radiologist.title)
            ? ""
            : report.radiologist.title;
          setSelectedRadiologist({
            value: report.radiologist.id,
            label: title + ". " + report.radiologist.fullname,
          });
        }
        proceList.push({
          value: data.procedure.proc_id,
          label: data.procedure.name,
        });
        setProcedureList(proceList);
        if (Util.isEmpty(selectedProcedure.value) && proceList.length > 0) {
          setSelectedProcedure(proceList[0]);
        }
      }
    } catch (err: any) {
      const errMsg = `Get Order failed. ${err.code}: ${err.message}`;
      console.log("ERROR: ", errMsg);
      error.fatal = errMsg;
      setState({ ...state, error });
    }
  };

  const getRadiologists = async () => {
    let error = state.error;
    try {
      const response = await fetchRadiologists();
      const response_data = response?.data;

      if (response_data.result.status == "NG") {
        error.fatal = response_data.result.msg;
        setState({ ...state, error: error });
      } else if (Util.isObjectEmpty(response_data.data)) {
        // Get data from image and set to
        error.fatal = t(
          "There is no any radiologist. Please contact your administrator."
        );
        setState({ ...state, error: error });
      } else {
        let newList = [] as any;

        response_data.data.map((item: any) =>
          newList.push({
            value: item.id,
            label: Util.isEmpty(item.title)
              ? ""
              : item.title + ". " + item.fullname,
          })
        );
        setRadiologistList(newList);
      }
    } catch (err: any) {
      const errMsg = "Get Radiologist failed. " + err.code + ": " + err.message;
      console.log("ERROR: ", errMsg);
      error.fatal = errMsg;
      setState({ ...state, error: error });
    }
  };
  const getReportTemplates = async (modality: any) => {
    let error = state.error;
    try {
      const response = await fetchReportTemplates(modality);
      const response_data = response?.data;

      if (response_data.result.status == "NG") {
        error.fatal = response_data.result.msg;
        setState({ ...state, error: error });
      } else if (Util.isObjectEmpty(response_data.data)) {
        // Get data from image and set to
        //setRadiologistList(response_data.data);
        error.fatal = t(
          "There is no any radiologist. Please contact your administrator."
        );
        setState({ ...state, error: error });
      } else {
        let newList = [] as any;
        let originalList = [] as any;

        //response_data.data.map(item => (newList.push({ value: item.id, label: item.name })));
        response_data.data.map(
          (item: any) => (
            newList.push({ value: item.id, label: item.name }),
            (originalList[item.id] = {
              findings: item.findings,
              conclusion: item.conclusion,
            })
          )
        );
        setReportTemplateList(newList);

        // Set to orginal list of get data when select
        setReportTemplateOriginList(originalList);
      }
    } catch (err: any) {
      const errMsg =
        "Get Report template failed. " + err.code + ": " + err.message;
      console.log("ERROR: ", errMsg);
      error.fatal = errMsg;
      setState({ ...state, error: error });
    }
  };

  const getScanProtocols = async (modality: any) => {
    //fetch Scan Type list
    let error = state.error;
    try {
      const response = await fetchScanProtocols(modality);
      const response_data = response?.data;
      let newList = [] as any;
      let originalList = [] as any;

      if (response_data.result.status == "NG") {
        error.fatal = response_data.result.msg;
        setState({ ...state, error: error });
      } else if (Util.isObjectEmpty(response_data.data)) {
        // Get data from image and set to
        //setRadiologistList(response_data.data);
        // error.fatal = t('There is no any radiologist. Please contact your administrator.');
        // setState({ ...state, error: error });
      } else {
        // let newList = [];
        // let originalList = [];

        //response_data.data.map(item => (newList.push({ value: item.id, label: item.name })));
        response_data.data.map(
          (item: any) => (
            newList.push({ value: item.id, label: item.name }),
            (originalList[item.id] = {
              regular: item.regular,
              by_medicine: item.by_medicine,
              by_disease: item.by_disease,
            })
          )
        );
      }
      setScanProtocolList(newList);
      // Set to orginal list of get data when select
      setScanProtocolOriginList(originalList);
    } catch (err: any) {
      const errMsg = "Get Protocol failed. " + err.code + ": " + err.message;
      console.log("ERROR: ", errMsg);
      error.fatal = errMsg;
      setState({ ...state, error: error });
    }
  };

  // const clearState = () => {
  //   setErrors({ ...emptyError });
  // };

  const onEditReport = (event: any) => {
    // Update status and the sreen auto reload
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        status: Utils.DRAFT,
      },
    }));

    // Backup origin report data
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        findings_origin: reportData.report.findings,
      },
    }));
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        conclusion_origin: reportData.report.conclusion,
      },
    }));
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        scan_protocol_origin: reportData.report.scan_protocol,
      },
    }));
  };
  const onUndoEditReport = () => {
    // Back report data to origin
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        status: reportData.report.status_origin,
      },
    }));
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        findings: reportData.report.findings_origin,
      },
    }));
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        conclusion: reportData.report.conclusion_origin,
      },
    }));
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        scan_protocol: reportData.report.scan_protocol_origin,
      },
    }));
  };

  const onDiscardReport = (event: any) => {
    setIsDeleteConfirmShow(true);
  };

  const doDiscardReport = async (reportId: any) => {
    let error = state.error;
    try {
      // Call Rest API
      const response = await discardReport(reportId);
      const response_data = response.data;
      if (response_data.result.status == "NG") {
        error.system = response_data.result.msg;
        setState({ ...state, error: error });
      } else {
        setInfo(t("The report is discarded"));
        // Clear report data in state
        setReportData(emptyReportData);
        setShowElement(true);
      }
    } catch (err: any) {
      // handle error
      console.log(err.response.data);
      //let msg = err.response.data.result.item + ' ' + err.response.data.result.msg;
      let msg = err.response.data.detail
        ? err.response.data.detail
        : err.message;
      error.system = msg;
      setState({ ...state, error: error });
    }
    // Set number of time showing information message, 3s
    setTimeout(function () {
      setInfo("");
      setShowElement(false);
    }, 3000);
  };

  const onClose = (event: any) => {
    // Close the current tab
    if (typeof window !== "undefined") {
      window.close();
    }
  };
  const onCloseConfirm = () => {
    setIsConfirmShow(false);
  };
  const onApproveOnConfirm = (event: any) => {
    switch (event.action.id) {
      case "yes":
        setIsConfirmShow(false);
        doReport(event, Utils.FINAL);
        break;
      case "cancel":
        setIsConfirmShow(false);
        break;
    }
  };

  const onDeleteOnConfirm = (event: any) => {
    switch (event.action.id) {
      case "yes":
        setIsDeleteConfirmShow(false);
        doDiscardReport(reportData.report.id);
        break;
      case "cancel":
        setIsDeleteConfirmShow(false);
        break;
    }
  };
  const onApprove = (event: any) => {
    // Format as font-family, font-size
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    formatEditorData();
    // Check error
    let isError = validate();
    // No error
    if (!isError) {
      setIsConfirmShow(true);
    }
    // Final status => call at onConfirmSubmit
  };
  const onSaveReport = (event: any) => {
    // Format as font-family, font-size
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    formatEditorData();
    // Check error
    let isError = validate();
    // Draft status
    if (!isError) {
      doReport(event, Utils.DRAFT);
    }
    //alert(state.workingItem.report);
    // Generate a HL7 msg
  };

  const doReport = async (event: any, status: string) => {
    setShowElement(true);
    // If no error (error = empty)
    if (Util.isEmpty(reportData.report.id)) {
      // Create a new report
      let data = {
        accession_no: accession_no,
        study_iuid: study_iuid,
        scan_protocol: reportData.report.scan_protocol,
        findings: reportData.report.findings,
        conclusion: reportData.report.conclusion,
        status: status,
        radiologist_id: selectedRadiologist.value,
        procedure_id: selectedProcedure.value,
      };

      // Create
      await onCreateReport(event, data);
    } else {
      // Update the report
      let data = {
        scan_protocol: reportData.report.scan_protocol,
        findings: reportData.report.findings,
        conclusion: reportData.report.conclusion,
        status: status,
      };
      // Update
      await onUpdateReport(event, reportData.report.id, data);
    }
    // }
    // Set number of time showing information message, 3s
    setTimeout(function () {
      setInfo("");
      setShowElement(false);
    }, 3000);
  };

  const onCreateReport = async (event: any, data: any) => {
    let error = state.error;
    // event.preventDefault();

    try {
      // Call Rest API
      const response = await createReport(data);

      const response_data = response.data;

      if (response_data.result.status == "NG") {
        error.system = response_data.result.msg;
        if (response_data.result.msg.includes("duplicate key value")) {
          error.system = t("The report already exists");
        }
        setState({ ...state, error: error });
        // Get exist report
        //getReportByStudy(study_iuid);
      } else {
        let info_msg = "The report is saved as draft";
        if (data.status === Utils.FINAL) info_msg = "The report is approved";

        setInfo(t(info_msg));
        // Set latest report
        response_data.data.report.status_origin =
          response_data.data.report.status;

        setReportData(response_data.data);
      }
    } catch (err: any) {
      // handle error
      console.log(err.response.data.result);
      let msg =
        err.response.data.result.item + " " + err.response.data.result.msg;
      error.system = msg;
      setState({ ...state, error: error });
    }
  };

  const onUpdateReport = async (event: any, id: any, data: any) => {
    let error = state.error;
    // event.preventDefault();

    //setInfo('')

    try {
      const response = await updateReport(id, data);

      const response_data = response.data;
      if (response_data.result.status == "NG") {
        error.system = response_data.result.msg;
        setState({ ...state, error: error });
      } else {
        let info_msg = "The report is updated as draft";
        if (data.status === Utils.FINAL) info_msg = "The report is re-approved";

        setInfo(t(info_msg));
        // Set latest report
        response_data.data.report.status_origin =
          response_data?.data?.report.status;
        setReportData(response_data.data);
      }
    } catch (err: any) {
      // handle error
      let msg =
        err.response.data.result.item + " " + err.response.data.result.msg;
      error.system = msg;
      setState({ ...state, error: error });
    }
  };

  const validate = (isCreateReport = true) => {
    // Reset error to empty
    let error = Util.initEmptyReportError();
    setState({ ...state, error: error });

    let isError = false;
    const findings = reportData.report.findings;
    const conclusion = reportData.report.conclusion;

    let item = t("Findings");
    // Check findings
    if (Util.isEmpty(findings)) {
      error.findings = t("{0} is required").replace("{0}", item);
      setState({ ...state, error: error });
      isError = true;
    }

    // Check conclusion
    if (Util.isEmpty(conclusion)) {
      item = t("Conclusion");
      error.conclusion = t("{0} is required").replace("{0}", item);
      setState({ ...state, error: error });
      isError = true;
    }
    if (isCreateReport) {
      // Check selected radiologist
      if (Util.isEmpty(selectedRadiologist.value)) {
        item = t("Radiologist");
        error.radiologist = t("{0} is required").replace("{0}", item);
        setState({ ...state, error: error });
        isError = true;
      }
      // Check selected procedure
      if (Util.isEmpty(selectedProcedure.value)) {
        item = t("Procedure");
        error.procedure = t("{0} is required").replace("{0}", item);
        setState({ ...state, error: error });
        isError = true;
      }
    }
    return isError;
  };

  const handleOnBeforeGetContent = () => {
    return new Promise((resolve) => {
      // Re-format editor data and set to state (setReportData)
      formatEditorData();

      // To make sure to get changed editor data
      setReportData((reportData) => ({ ...reportData, resolve: resolve }));
    });
  };

  useEffect(() => {
    const { resolve } = reportData;
    if (resolve) {
      resolve(undefined);
    }
  }, [reportData]);

  const formatEditorData = () => {
    // Don't do if it is in label
    if (reportData.report.status === "F" || reportData.report.status === "C")
      return;

    const editorFindings = editorFindingsRef.current;
    const editorConclusion = editorConclusionRef.current;
    const editorProtocol = editorProtocolRef.current;

    if (editorProtocol) {
      // 'Select All' to change font
      editorProtocol.execute("selectAll");
      editorProtocol.execute("removeFormat");
    }

    if (editorFindings) {
      editorFindings.execute("selectAll");
      editorFindings.execute("removeFormat");
    }

    if (editorConclusion) {
      editorConclusion.execute("selectAll");
      editorConclusion.execute("removeFormat");
    }

    // Get editor data
    const findingsData = editorFindings ? editorFindings.getData() : "";
    const conclusionData = editorConclusion ? editorConclusion.getData() : "";
    const protocolData = editorProtocol ? editorProtocol.getData() : "";

    // Set to state
    setReportData((reportData) => ({
      ...reportData,
      report: { ...reportData.report, findings: findingsData },
    }));
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        conclusion: conclusionData,
      },
    }));
    setReportData((reportData) => ({
      ...reportData,
      report: {
        ...reportData.report,
        scan_protocol: protocolData,
      },
    }));
  };

  const onChangeFindings = (event: any, editor: any) => {
    // Get editor data and save by editorXXXRef in doReport
    // //Update data when input finding
    // const data = editor.getData();
    // setReportData(reportData => ({ ...reportData, findings: data }));
  };
  const onChangeScanProtocol = (event: any, editor: any) => {
    // const data = editor.getData();
    // setReportData(reportData => ({ ...reportData, scan_protocol: data }));
  };

  const onChangeConclusion = (event: any, editor: any) => {
    // const data = editor.getData();
    // setReportData(reportData => ({ ...reportData, conclusion: data }));
  };

  const onChangeRadiologistHandler = (value: any) => {
    setSelectedRadiologist(value);
  };

  const onChangeProcedureHandler = (value: any) => {
    setSelectedProcedure(value);
  };

  const onChangeReportTemplateHandler = (value: any) => {
    setSelectedReportTemplate(value);

    // Fill to textbox
    if (value.value) {
      const findings = reportTemplateOriginList[value.value].findings;
      const conclusion = reportTemplateOriginList[value.value].conclusion;
      setReportData((reportData) => ({
        ...reportData,
        report: { ...reportData.report, findings: findings },
      }));
      setReportData((reportData) => ({
        ...reportData,
        report: {
          ...reportData.report,
          conclusion: conclusion,
        },
      }));
    }
  };
  const onChangeProtocolHandler = (value: any) => {
    setSelectedScanProtocol(value);
    if (value.value) {
      const regular = scanProtocolOriginList[value.value].regular;
      setReportData((reportData) => ({
        ...reportData,
        report: {
          ...reportData.report,
          scan_protocol: regular,
        },
      }));
      setSelectedRadio("regular");
    }
  };

  const handleOptionChangeRadioBtn = (type: any) => {
    if (selectedScanProtocol && selectedScanProtocol.value) {
      let data;
      switch (type) {
        case "by_medicine":
          data = scanProtocolOriginList[selectedScanProtocol.value].by_medicine;
          break;
        case "by_disease":
          data = scanProtocolOriginList[selectedScanProtocol.value].by_disease;
          break;
        default:
          data = scanProtocolOriginList[selectedScanProtocol.value].regular;
      }
      setReportData((reportData) => ({
        ...reportData,
        report: { ...reportData.report, scan_protocol: data },
      }));
      setSelectedRadio(type);
    }
  };

  const onChangePrintTemplateHandler = (value: any) => {
    setSelectedPrintTemplate(value);
  };

  const isShowReportTemplate = () => {
    let isError = validate(false);
    if (!isError) {
      setIsDialogOpen(true);
      setErrorMessage("");
      setReportTemplateName("");
    }
  };

  const isCloseReportTemplate = () => {
    setIsDialogOpen(false);
  };

  const onSaveReportTemplate = async () => {
    const name = reportTemplateName;
    let error = state.error;
    if (name) {
      const data = {
        name: name,
        type: "custom",
        modality: reportData.modality_type,
        findings: reportData.report.findings,
        conclusion: reportData.report.conclusion,
      };
      try {
        const response = await createReportTemplate(data);
        const response_data = response?.data;
        if (response_data.result.status == "NG") {
          error.fatal = response_data.result.msg;
          setState({ ...state, error: error });
          setIsDialogOpen(false);
        } else {
          getReportTemplates(reportData.modality_type); //get report template without refresh page.
          setIsDialogOpen(false);
        }
      } catch (err: any) {
        setState({ ...state, error: err });
      }
    } else {
      let item = t("The report template name");
      setErrorMessage(t("{0} is required").replace("{0}", item));
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  return (
    <>
      <title>{t("Report Detail")}</title>
      <HeaderWorklist>
        <div className="absolute text-color md:flex-row flex-col left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform gap-2">
          <div className="flex flex-row justify-center">
            {Util.isPrintEnabled(reportData.report.status) &&
              !Util.isObjectEmpty(printTemplateList) && (
                <>
                  <div className="mt-1 whitespace-nowrap text-white">
                    {t("Print template")}:{" "}
                  </div>
                  <div className="w-40 h-[30px]">
                    <Select
                      id="Test"
                      isClearable={false}
                      onChange={onChangePrintTemplateHandler}
                      options={printTemplateList}
                      value={selectedPrintTemplate}
                    />
                  </div>
                </>
              )}
          </div>
          <div className="flex flex-row">
            {typeof window !== "undefined" && (
              <ReactToPrint
                trigger={() => (
                  <Button
                    className={"button-class mr-2"}
                    type={ButtonEnums.type.primary}
                    size={ButtonEnums.size.medium}
                    disabled={!reportData.accession_no}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ fill: "none" }}
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-printer"
                    >
                      <g transform="scale(0.8, 0.8) translate(3, 3)">
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
                        <rect x="6" y="14" width="12" height="8" rx="1" />
                      </g>
                    </svg>
                    {t("Print Preview")}
                  </Button>
                )}
                content={() => componentRef.current}
                onBeforeGetContent={handleOnBeforeGetContent}
              />
            )}
            {reportData.accession_no && (
              <div style={{ display: "none" }}>
                <PDFComponent
                  ref={componentRef}
                  reportData={reportData}
                  templateData={selectedPrintTemplate}
                />
              </div>
            )}
            {Util.isPrintEnabled(reportData.report.status) &&
              !Util.isObjectEmpty(printTemplateList) && (
                <>
                  {/* Edit final report permission */}
                  {hasEditReportPermission && (
                    <Button
                      className={"button-class mr-2"}
                      type={ButtonEnums.type.primary}
                      size={ButtonEnums.size.medium}
                      onClick={onEditReport}
                      disabled={!Util.isEditEnabled(reportData.report.status)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ fill: "none" }}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-pencil"
                      >
                        <g transform="scale(0.8, 0.8) translate(3, 3)">
                          <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                          <path d="m15 5 4 4" />
                        </g>
                      </svg>
                      {t("Edit")}
                    </Button>
                  )}

                  {/* Delete final report permission */}
                  {hasDeleteReportPermission && (
                    <Button
                      className={"button-class mr-2"}
                      type={ButtonEnums.type.primary}
                      size={ButtonEnums.size.medium}
                      onClick={onDiscardReport}
                      disabled={!Util.isEditEnabled(reportData.report.status)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ fill: "none" }}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-trash-2"
                      >
                        <g transform="scale(0.8, 0.8) translate(3, 3)">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </g>
                      </svg>
                      {t("Discard")}
                    </Button>
                  )}
                </>
              )}

            {/* Icons: https://lucide.dev/icons */}
            {/* Create as Draft and Approve report permission */}
            {hasAddReportPermission &&
              !Util.isPrintEnabled(reportData.report.status) && (
                <>
                  <Button
                    className={"button-class mr-2"}
                    type={ButtonEnums.type.primary}
                    size={ButtonEnums.size.medium}
                    onClick={onApprove}
                    style={{ fill: "none" }}
                    disabled={
                      !Util.isApproveEnabled(
                        reportData.report.status,
                        state.error.fatal
                      )
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ fill: "none" }}
                      className="lucide lucide-square-check-big"
                    >
                      <g transform="scale(0.8, 0.8) translate(3, 3)">
                        {" "}
                        <path d="m9 11 3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </g>
                    </svg>
                    {t("Approve")}
                  </Button>

                  {reportData.report.status_origin != "F" &&
                    reportData.report.status_origin != "C" && (
                      <Button
                        className={"button-class mr-2"}
                        type={ButtonEnums.type.primary}
                        size={ButtonEnums.size.medium}
                        onClick={onSaveReport}
                        disabled={
                          !Util.isSaveEnabled(
                            reportData.report.status,
                            state.error.fatal
                          )
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ fill: "none" }}
                          className="lucide lucide-save"
                        >
                          <g transform="scale(0.8, 0.8) translate(3, 3)">
                            <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                            <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                            <path d="M7 3v4a1 1 0 0 0 1 1h7" />
                          </g>
                        </svg>
                        {t("Save as Draft")}
                      </Button>
                    )}
                  {reportData.report.status_origin !=
                    reportData.report.status && (
                    <Button
                      className={"button-class mr-2"}
                      type={ButtonEnums.type.primary}
                      size={ButtonEnums.size.medium}
                      onClick={onUndoEditReport}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ fill: "none" }}
                        className="lucide lucide-undo-2"
                      >
                        <g transform="scale(0.8, 0.8) translate(3, 3)">
                          <path d="M9 14 4 9l5-5" />
                          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                        </g>
                      </svg>
                      {t("Undo")}
                    </Button>
                  )}
                </>
              )}

            <Button
              className={"button-class text-[13px]"}
              type={ButtonEnums.type.secondary}
              size={ButtonEnums.size.medium}
              onClick={onClose}
              style={{ fill: "none" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ fill: "none" }}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-square-x"
              >
                <g transform="scale(0.8, 0.8) translate(3, 3)">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </g>
              </svg>
              {t("Close")}
            </Button>
          </div>
        </div>
      </HeaderWorklist>
      <div
        className={`relative  flex w-full md:flex-row flex-col flex-nowrap items-stretch ${
          collapsed ? "collapsed" : ""
        }`}
      >
        {/* {left panel } */}
        <div className="bg-black  flex flex-col transition-all duration-300 ease-in-out md:h-screen">
          <div className="w-full px-2 pb-2 text-white">
            {" "}
            {/* Test show image: <img src={Constants.USER_MNG_URL + reportData.radiologist.sign} ></img> */}
            <div className="flex items-center justify-between">
              {!collapsed && (
                <div
                  className="font-semibold text-blue-300"
                  style={{ fontSize: "17px" }}
                >
                  {t("Patient Information")}
                </div>
              )}
              <button
                className="toggle-button px-2 py-1 text-red-700"
                onClick={toggleSidebar}
                //title={t("Collapse")}
              >
                {collapsed ? (
                  ""
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    className="text-primary-active bg-black"
                  >
                    <g fill="none" fillRule="evenodd">
                      <path d="M20 0H0v20h20z"></path>
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M17 10.406H7.166M11.235 6.337l-4.069 4.07 4.07 4.068M3.758 14.475V6.337"
                      ></path>
                    </g>
                  </svg>
                )}
              </button>
            </div>
            {!collapsed && (
              <div className="flex flex-row">
                <div className="flex w-full flex-row">
                  <div className="flex w-full flex-row">
                    <div className="mt-2 flex w-full flex-col text-right">
                      <div className="mb-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("Patient Name")}
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light pl-0 text-right"
                          >
                            {reportData.patient.fullname}
                          </Typography>
                        </div>
                      </div>
                      <div className="mb-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("PID")}
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light pl-0 text-right"
                          >
                            {reportData.patient.pid}
                          </Typography>
                        </div>
                      </div>
                      <div className="mb-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("DOB")}
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light pl-0 text-right"
                          >
                            {Util.formatDate(reportData.patient.dob)}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="w-full p-2 text-white">
              <div
                className="font-semibold text-blue-300"
                style={{ fontSize: "17px" }}
              >
                {t("Order Information")}
              </div>
              <div className="flex flex-row">
                <div className="flex w-full flex-row">
                  <div className="flex w-full flex-row">
                    <div className="mt-2 flex w-full flex-col text-right">
                      <div className="mb-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            // variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("ACN")}
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light pl-0 text-right"
                          >
                            {reportData.accession_no}
                          </Typography>
                        </div>
                      </div>
                      <div className="mb-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("Procedure")}
                          </Typography>
                        </div>
                        {/* {Util.isFinalReport(reportData.status) && ( */}
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light pl-0 text-right"
                          >
                            {reportData.procedure.name
                              ? reportData.procedure.name
                              : selectedProcedure.label}
                          </Typography>
                        </div>
                        {/* )} */}

                        {/* {!Util.isFinalReport(reportData.status) && (<div className="flex flex-col">
                        <div className="flex flex-col w-56">
                          <Select
                            isClearable={false}
                            onChange={onChangeProcedureHandler}
                            options={procedureList}
                            value={selectedProcedure}
                            isDisabled={Utils.isObjectEmpty(procedureList)}
                          />
                        </div>
                      </div>
                      )} */}
                      </div>
                      <div className="mb-2 mt-4 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("Indication")}
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light pl-0 text-right"
                          >
                            {reportData.clinical_diagnosis}
                          </Typography>
                        </div>
                      </div>

                      <div className="mb-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("Ordering Physician")}
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light pl-0 text-right"
                          >
                            {reportData.referring_phys.fullname}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!collapsed && (
            <div className="w-full p-2 text-white">
              <div
                className="font-semibold text-blue-300"
                style={{ fontSize: "17px" }}
              >
                {t("Report Information")}
              </div>
              <div className="flex flex-row">
                <div className="flex w-full flex-row">
                  <div className="flex w-full flex-row">
                    <div className="flex w-full flex-col text-right">
                      <div className="mt-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-left font-semibold"
                          >
                            {t("Status")}
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography
                            variant="subtitle"
                            className={`pl-0 text-right text-primary-light`}
                          >
                            {t(Util.getStatusFull(reportData.report.status))} -{" "}
                            {reportData.report.created_time}
                          </Typography>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-row justify-between">
                        <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                          <Typography
                            variant="subtitle"
                            className="text-primary-light w-full text-right font-semibold"
                          >
                            {t("Radiologist")}
                          </Typography>
                        </div>

                        {reportData.report.id && (
                          <div className="flex flex-col">
                            <Typography
                              variant="subtitle"
                              className="text-primary-light pl-0 text-left"
                            >
                              {reportData.radiologist.title ?? ""}.{" "}
                              {reportData.radiologist.fullname}
                            </Typography>
                          </div>
                        )}
                        {!reportData.report.id && (
                          <div className="flex w-56 flex-col">
                            <Select
                              id="test"
                              isClearable={false}
                              onChange={onChangeRadiologistHandler}
                              options={radiologistList}
                              value={selectedRadiologist}
                              isDisabled={Util.isObjectEmpty(radiologistList)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {collapsed && (
          <div className="absolute">
            <button
              className="toggle-button x-2 py-1 text-red-700"
              onClick={toggleSidebar}
              //title={t("Expand")}
            >
              {collapsed ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="text-primary-active"
                >
                  <g fill="none" fillRule="evenodd">
                    <path d="M0 0h20v20H0z"></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 10.406h9.834M8.765 6.337l4.069 4.07-4.07 4.068M16.242 14.475V6.337"
                    ></path>
                  </g>
                </svg>
              ) : (
                ""
              )}
            </button>
          </div>
        )}

        {/* Right panel - Findigs/Conclusion*/}
        <div className=" bg-black flex md:h-screen flex-1 flex-col">
          <div className="flex w-full flex-row">
            <div className="flex w-full flex-col text-left">
              {!Util.isReportErrorEmpty(state.error) && (
                <div role="alert" className="ml-2 mr-2">
                  <div className="flex justify-between rounded-t bg-red-500 px-4 py-2 font-bold text-white">
                    <div>{t("Error")}</div>
                    {/* <div onClick={onClearError} style={{ cursor: 'pointer' }}><svg xmlns="http://www.w3.org/2000/svg" style={{ fill: 'none' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-x"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg></div> */}
                  </div>
                  <div className="rounded-b border border-t-0 border-red-400 bg-red-100 px-4 py-3 text-red-700">
                    <ul className="list-disc ml-3">
                      {!Util.isEmpty(state.error.fatal) && (
                        <li>{state.error.fatal}</li>
                      )}
                      {!Util.isEmpty(state.error.system) && (
                        <li>{state.error.system}</li>
                      )}
                      {!Util.isEmpty(state.error.radiologist) && (
                        <li>{state.error.radiologist}</li>
                      )}
                      {!Util.isEmpty(state.error.findings) && (
                        <li>{state.error.findings}</li>
                      )}
                      {!Util.isEmpty(state.error.conclusion) && (
                        <li>{state.error.conclusion}</li>
                      )}
                      {!Util.isEmpty(state.error.scan_protocol) && (
                        <li>{state.error.scan_protocol}</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              {!Util.isEmpty(info) && showElement && (
                <div
                  className="ml-2 mr-2 flex items-center rounded border border-t-0 border-blue-500 bg-blue-500 px-4 py-3 text-white"
                  role="alert"
                >
                  <svg
                    className="mr-2 h-3 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z" />
                  </svg>
                  <Typography>{info}</Typography>
                </div>
              )}

              {!hasAddReportPermission &&
                !Util.isFinalReport(reportData.report.status) && (
                  <div className="body mt-2 flex justify-between p-2">
                    <div
                      className="w-full text-red-500"
                      style={{ fontSize: "17px" }}
                    >
                      {t("No report yet")}
                    </div>
                  </div>
                )}

              {/* Procedure - Template */}
              {hasAddReportPermission &&
                !Util.isFinalReport(reportData.report.status) && (
                  <div className="body mt-2 flex justify-between p-2">
                    <div className="procedure flex">
                      <div
                        className="md:mr-4 mr-2 text-blue-300"
                        style={{ fontSize: "17px" }}
                      >
                        {t("Procedure")}
                      </div>
                      <div className="flex flex-col">
                        <div className="w-56">
                          <Select
                            id="test"
                            isClearable={false}
                            onChange={onChangeProcedureHandler}
                            options={procedureList}
                            value={selectedProcedure}
                            isDisabled={Util.isObjectEmpty(procedureList)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="reportTemplate flex">
                      <div
                        className="mr-2 text-blue-300"
                        style={{ fontSize: "17px" }}
                      >
                        {t("Report template")}
                      </div>
                      <div className="flex md:flex-row flex-col">
                        <div className="w-56">
                          <Select
                            id="test"
                            isClearable={false}
                            onChange={onChangeReportTemplateHandler}
                            options={reportTemplateList}
                            value={selectedReportTemplate}
                            isDisabled={Util.isObjectEmpty(reportTemplateList)}
                          />
                        </div>
                        <div className="md:ml-1">
                          <Button
                            className={"button-class"}
                            type={ButtonEnums.type.primary}
                            size={ButtonEnums.size.medium}
                            onClick={isShowReportTemplate}
                            disabled={!Util.isEmpty(state.error.fatal)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ fill: "none" }}
                              className="lucide lucide-save"
                            >
                              <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                              <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                              <path d="M7 3v4a1 1 0 0 0 1 1h7" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                      {typeof window !== "undefined" && (
                        <Modal
                          isOpen={isDialogOpen}
                          contentLabel="Create Report Template"
                          className="bg-slate-500 modal"
                          overlayClassName="overlay"
                        >
                          <h2 className="text-primary-light">
                            {t("Create Report Template")}
                          </h2>
                          <input
                            type="text"
                            value={reportTemplateName}
                            onChange={(e) => {
                              setReportTemplateName(e.target.value);
                            }}
                            placeholder={
                              errorMessage ||
                              t("Enter the report template name")
                            }
                            className={
                              errorMessage ? "error rounded" : "rounded"
                            }
                          />
                          <Button
                            className="bg-customblue-30 hover:bg-customblue-50 active:bg-customblue-20 text-white transition duration-300 ease-in-out focus:outline-none"
                            onClick={isCloseReportTemplate}
                          >
                            {t("Cancel")}
                          </Button>
                          <Button
                            className="bg-primary-main hover:bg-customblue-80 active:bg-customblue-40 text-white transition duration-300 ease-in-out focus:outline-none"
                            onClick={onSaveReportTemplate}
                          >
                            {t("Save")}
                          </Button>
                        </Modal>
                      )}
                    </div>
                  </div>
                )}
              {/* Show report text in label */}
              <div className="mb-2 flex flex-col px-2 pt-2">
                <div className="body flex flex-row items-center">
                  <div className="flex justify-between">
                    <div
                      className="text-blue-300"
                      style={{
                        fontSize: "17px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {t("Protocol")}
                    </div>
                    {!Util.isFinalReport(reportData.report.status) && (
                      <div className="pl-scan ml-2">
                        <Select
                          id="test"
                          isClearable={false}
                          onChange={onChangeProtocolHandler}
                          options={scanProtocolList}
                          value={selectedScanProtocol}
                          className="flex justify-center text-center"
                          //components={{ ClearIndicator: null }}
                          isDisabled={!reportData.accession_no}
                        />
                      </div>
                    )}
                  </div>
                  {!Util.isFinalReport(reportData.report.status) && (
                    <div className="flex flex-row justify-center text-white">
                      <label className="ml-2 flex items-center md:ml-4">
                        <input
                          type="radio"
                          value="regular"
                          onChange={() => handleOptionChangeRadioBtn("regular")}
                          checked={selectedRadio === "regular"}
                          name="option"
                          className="form-radio bg-black text-white"
                          disabled={!selectedRadio}
                        />
                        <span className="ml-1">{t("Regular")}</span>
                      </label>
                      <label className="ml-2 flex items-center md:ml-4">
                        <input
                          type="radio"
                          value="by_medicine"
                          onChange={() =>
                            handleOptionChangeRadioBtn("by_medicine")
                          }
                          checked={selectedRadio === "by_medicine"}
                          name="option"
                          className="form-radio bg-black text-white"
                          disabled={!selectedRadio}
                        />
                        <span className="ml-1">{t("Medicine")}</span>
                      </label>
                      <label className="ml-2 flex items-center md:ml-4">
                        <input
                          type="radio"
                          value="by_disease"
                          onChange={() =>
                            handleOptionChangeRadioBtn("by_disease")
                          }
                          checked={selectedRadio === "by_disease"}
                          name="option"
                          className="form-radio bg-black text-white"
                          disabled={!selectedRadio}
                        />
                        <span className="ml-1">{t("By Disease")}</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="editor-container editor-container_classic-editor mt-2">
                  <div id="scantype" className="editor-container__editor">
                    {isLayoutReady &&
                      !Util.isFinalReport(reportData.report.status) &&
                      typeof window !== "undefined" && (
                        <CustomEditor
                          data={reportData.report.scan_protocol}
                          onChange={onChangeScanProtocol}
                          disabled={Util.isEditorDisabled(
                            state.error.fatal,
                            user?.permissions
                          )}
                          onReady={(editor) => {
                            editorProtocolRef.current = editor;
                          }}
                        />
                      )}
                    {Util.isFinalReport(reportData.report.status) && (
                      <Typography
                        variant="subtitle"
                        className="text-primary-light pl-0 text-left"
                      >
                        <div
                          className="findings"
                          dangerouslySetInnerHTML={{
                            __html: reportData.report.scan_protocol,
                          }}
                        />
                      </Typography>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-0 flex flex-col p-2">
                <div className="flex flex-row justify-between">
                  <div
                    className="w-full text-blue-300"
                    style={{ fontSize: "17px" }}
                  >
                    {t("Findings")}
                  </div>
                </div>
                {Util.isFinalReport(reportData.report.status) && (
                  <div className="mt-2 flex flex-col">
                    <Typography
                      variant="subtitle"
                      className="text-primary-light pl-0 text-left"
                    >
                      <div
                        className="findings"
                        dangerouslySetInnerHTML={{
                          __html: reportData.report.findings,
                        }}
                      />
                    </Typography>
                  </div>
                )}
                {!Util.isFinalReport(reportData.report.status) && (
                  <div
                    id="findings"
                    className="editor-container editor-container_classic-editor"
                    ref={editorContainerRef}
                  >
                    <div className="editor-container__editor">
                      {/* Show report input form */}
                      <div ref={editorRef}>
                        {isLayoutReady && typeof window !== "undefined" && (
                          <CustomEditor
                            data={reportData.report.findings}
                            onChange={onChangeFindings}
                            disabled={Util.isEditorDisabled(
                              state.error.fatal,
                              user?.permissions
                            )}
                            onReady={(editor) => {
                              editorFindingsRef.current = editor;
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-2 flex flex-col px-2 pt-2 h-screen md:h-full">
                <div className="flex flex-row justify-between">
                  <div
                    className="w-full text-blue-300"
                    style={{ fontSize: "17px" }}
                  >
                    {t("Conclusion")}
                  </div>
                </div>
                {Util.isFinalReport(reportData.report.status) && (
                  <div className="mt-2 flex flex-col">
                    <Typography
                      variant="subtitle"
                      className="text-primary-light pl-0 text-left font-semibold"
                    >
                      <div
                        className="conclusion"
                        dangerouslySetInnerHTML={{
                          __html: reportData.report.conclusion,
                        }}
                      />
                    </Typography>
                  </div>
                )}
                {!Util.isFinalReport(reportData.report.status) && (
                  <div
                    id="conclusion"
                    className="editor-container editor-container_classic-editor"
                    ref={editorContainerRef}
                  >
                    <div className="editor-container__editor">
                      <div ref={editorRef}>
                        {isLayoutReady && (
                          <CustomEditor
                            data={reportData.report.conclusion}
                            onChange={onChangeConclusion}
                            disabled={Util.isEditorDisabled(
                              state.error.fatal,
                              user?.permissions
                            )}
                            onReady={(editor) => {
                              editorConclusionRef.current = editor;
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirm dialog */}
      {isConfirmShow && (
        <div
          className="absolute right-2 flex w-1/2 justify-center"
          style={{ top: "100px", right: "100px" }}
        >
          <Dialog
            title={t("Confirm")}
            text={t(
              "Diagnostic report will be approved by [{0}]. Are you sure to approve?"
            ).replace("{0}", selectedRadiologist.label)}
            onClose={onCloseConfirm}
            noCloseButton={false}
            onShow={() => {}}
            onSubmit={onApproveOnConfirm}
            actions={[
              {
                id: "cancel",
                text: t("Cancel"),
                type: ButtonEnums.type.secondary,
              },
              {
                id: "yes",
                text: t("Agree"),
                type: ButtonEnums.type.primary,
              },
            ]}
          />
        </div>
      )}

      {/* Delete Confirm dialog */}
      {isDeleteConfirmShow && (
        <div
          className="absolute right-2 flex w-1/2 justify-center"
          style={{ top: "100px", right: "100px" }}
        >
          <Dialog
            title={t("Confirm")}
            text={t("Are your sure to discard this report?")}
            onClose={onCloseConfirm}
            noCloseButton={false}
            onShow={() => {}}
            onSubmit={onDeleteOnConfirm}
            actions={[
              {
                id: "cancel",
                text: t("Cancel"),
                type: ButtonEnums.type.secondary,
              },
              {
                id: "yes",
                text: t("Agree"),
                type: ButtonEnums.type.primary,
              },
            ]}
          />
        </div>
      )}
    </>
  );
};

export default ReportComponent;
