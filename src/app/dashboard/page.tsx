"use client";
import PrivateRoute from "@/components/privateroutes";
import { useAuth } from "@/context/authcontext";
import React, { useEffect, useRef, useState } from "react";
import {
  FaCheckDouble,
  FaCircleNotch,
  FaMinus,
  FaPlus,
  FaPrint,
  FaTrashAlt,
  FaUpload,
} from "react-icons/fa";
import { read, utils } from "xlsx";
import PrintPage from "../print/page";
import ReactDOM from "react-dom/client";
import { FaRotate, FaX, FaXmark } from "react-icons/fa6";
import { FormatFileSize } from "@/utils/size-format/FormatFileSize";
import DragAndDropComponent from "@/components/DragAndDropComponent";
import FormattedNumber from "@/utils/FormattedNumber";
import TextLoading from "@/components/loaders/TextLoading";
import BackToTop from "@/components/buttons/BackToTop";
import api from "@/lib/axiosCall";
import { PrintData } from "@/utils/constants";
import { PrintDataType } from "@/types/PrintData";
import { Bounce, toast } from "react-toastify";
import { useVersion } from "@/context/versionContext";

export default function Page() {
  const { user } = useAuth();
  const { updateVersion, version, oldVersion, isOutDated, setIsOutDated }: any =
    useVersion();
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string }>({
    name: "",
    size: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isHideTable, setIsHideTable] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [progress, setProgress] = useState(0);
  const [isPrintCr, setIsPrintCr] = useState(false);
  const [backToTop, setBackToTop] = useState(false);
  const [formInput, setFormInput] = useState<PrintDataType>(PrintData);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const isCrOrMessageError =
    "You uploaded a Cash Sales Invoice/Sales Invoice, so you can't print a Collection Receipt/Official Receipt.";
  const isCsiSiMessageError =
    "You uploaded a Collection Receipt/Official Receipt, so you can't print a Cash Sales Invoice/Sales Invoice.";

  // const internalIdColumnIndex = 0;
  const mainLineName = 0;
  const date = 1;
  const taxNumber = 2;
  const terms = 3;
  const billingAddress = 4;
  const oscaPwdIdNo = 5;
  const businessStyle = 6;
  const cardHolderSignatures = 7;
  const quantity = 8;
  const unitOfMeasurement = 9;
  const articles = 10;
  const rateInclusiveVat = 11;
  const totalAmount = 12;
  const totalSalesVatExclusive = 13;
  const vatAmount = 14;
  const totalSalesVatInclusive = 15;
  const vatAmount2 = 16;
  const totalSalesVatExclusive2 = 17;
  const totalSalesVatExclusive3 = 18;
  const vatAmount3 = 19;
  const totalSalesVatInclusive2 = 20;
  const serialNumber = 21;
  const chassisNumber = 22;
  const conductionSticker = 23;
  const rateInclusiveOfTax = 24;
  const color = 25;
  const cashier = 26;
  const refNumber = 27;
  const lessWithHoldingTax = 28;

  const CR_Date = 0;
  const CR_Name = 1;
  const CR_TIN = 2;
  const CR_Address = 3;
  const CR_BusinessStyle = 4;
  const CR_AmountInFigures = 5;
  const CR_AmountInWords = 6;
  const CR_Memo = 7;
  const CR_FormOfPayment = 8;
  const CR_PartnerName = 9;

  // const billingAddress1 = 2;
  // const billingAddress2 = 3;
  // const billingAddress3 = 5;
  // const item = 9;
  // const units1 = 12;
  // const itemRate = 13;
  // const itemRate1 = 14;
  // const amount = 15;
  // const amountTax = 17;
  // const netTax = 18;
  // const transactionTotal = 19;

  useEffect(() => {
    const handleBackToTop = () => {
      if (window.scrollY > 400) {
        setBackToTop(true);
      } else {
        setBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleBackToTop);

    return () => {
      window.removeEventListener("scroll", handleBackToTop);
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [isLoading]);

  useEffect(() => {
    if (user || excelData || isPrintCr) {
      setFormInput(() => ({
        external_id: isPrintCr
          ? excelData[1]?.[CR_Name]
          : excelData[1]?.[mainLineName] ?? "",
        print_by: `${user?.branchCode}-${user?.branchName}`,
      }));
    }
  }, [user, excelData, isPrintCr]);

  const handleBackToTop = () => {
    const options: any = {
      top: 0,
      behavior: "smooth",
    };
    window.scrollTo(options);
  };

  const handlePrint = (componentType: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = (
        <PrintPage componentType={componentType} data={excelData} />
      );

      const printDocument = printWindow.document;
      printDocument.open();
      printDocument.write(`
        <html>
        <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <title>
        ${
          isPrintCr
            ? "Collection Receipt Print"
            : "Sales Invoice/Cash Sales Invoice Print"
        }
        </title>
        <style>`);
      printDocument.write(`
        @page{
        margin: 0;
        }
        body {
          font-family: Arial, sans-serif;
        }
      `);
      printDocument.write("</style></head><body>");
      printDocument.write('<div id="root"></div>');
      printDocument.write("</body></html>");
      printDocument.close();

      printWindow.onload = () => {
        const rootElement = printWindow.document.getElementById("root");
        if (rootElement) {
          const reactRoot = ReactDOM.createRoot(rootElement);
          reactRoot.render(printContent);

          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 50);
        }
      };
    }
  };

  const handleErrorPrint = (title: string) => {
    toast.info(title, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  };

  const printOptions = [
    {
      label: "Collection Receipt",
      action: () =>
        isPrintCr
          ? handlePrint("Collection Receipt")
          : handleErrorPrint(isCrOrMessageError),
    },
    {
      label: "Cash Sales Invoice",
      action: () =>
        !isPrintCr
          ? handlePrint("Cash Sales Invoice")
          : handleErrorPrint(isCsiSiMessageError),
    },
  ];

  const toggleDropdown = (e: any) => {
    setIsDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    let interval: any;
    let timeout: any;

    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prevProgress) => Math.min(prevProgress + 1, 100));
      }, 25);

      timeout = setTimeout(() => {
        setIsLoading(false);
        clearInterval(interval);
        setProgress(100);
      }, 2500);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoading]);
  const handleFileUpload = (e: any) => {
    setProgress(0);
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name;

    const fileSize = FormatFileSize(file.size);

    setFileInfo({
      name: fileName,
      size: fileSize,
    });

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target?.result as string;

      const workbook = read(data, { type: "array" });

      const worksheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[worksheetName];

      const jsonData: any[] = utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
      });

      const stringData = jsonData.map((row) =>
        row.map((cell: any) => {
          return String(cell);
        })
      );

      setExcelData(stringData);

      if (stringData[0]?.length <= 11) {
        setIsPrintCr(true);
      } else {
        setIsPrintCr(false);
      }
    };

    setIsFileUploaded(true);
    reader.readAsArrayBuffer(file);

    setIsLoading(true);
  };

  const handleRemoveFile = () => {
    setExcelData([]);
    setFileInfo({ name: "", size: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsFileUploaded(false);
    setProgress(0);
    setFormInput(PrintData);
  };
  const handleCancelUpload = () => {
    setExcelData([]);
    setFileInfo({ name: "", size: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsFileUploaded(false);
    setIsLoading(false);
    setProgress(0);
    setFormInput(PrintData);
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
    updateVersion();
  };

  const handleCloseTable = (rowIndex: number) => () => {
    setIsHideTable((isHideTable) => ({
      ...isHideTable,
      [rowIndex]: !isHideTable[rowIndex],
    }));
  };

  const handlePrintCount = async () => {
    setIsPrintLoading(true);
    try {
      const response = await api.post("/print-receipt-count", formInput);
      if (response.status === 201) {
        toast.success(response.data.message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error.response.status === 400) {
        toast.error(error.response.data.message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
        });
      }
    } finally {
      setIsPrintLoading(false);
      setExcelData([]);
      setFileInfo({ name: "", size: "" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsFileUploaded(false);
      setProgress(0);
      setFormInput(PrintData);
    }
  };

  return (
    <PrivateRoute>
      {isOutDated && (
        <div className="p-2 text-white fixed top-0 bg-red-500 w-full h-auto z-50">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3 items-center">
              <p className="text-sm">
                You are using the old version of Oracle NetSuite Printing.
                Please reload the page for the latest version.{" "}
                <span className="font-bold">
                  (Current Version: v{oldVersion} - Latest Version: v{version})
                </span>
              </p>
              <button
                onClick={() => window.location.reload()}
                type="button"
                className="p-2 flex gap-2 items-center rounded-sm text-sm bg-blue-500 hover:bg-blue-400"
              >
                <FaRotate /> <span>Reload now</span>
              </button>
            </div>
            <button
              onClick={() => setIsOutDated(false)}
              type="button"
              className="mr-3"
            >
              <FaX />
            </button>
          </div>
        </div>
      )}
      <div className="mt-5 pl-5">
        <h2 className="text-2xl text-[#333] uppercase">
          Welcome to the official Oracle NetSuite Printing System,{" "}
          <span className="font-semibold">{user?.branchName}</span>!
        </h2>
      </div>
      <div className="mt-5 px-5">
        <div className="border border-[#005483] pl-5 py-5 relative">
          <div className="mb-2 text-xl font-bold">
            {isLoading ? (
              <TextLoading />
            ) : excelData.length > 0 ? (
              "Preview Data"
            ) : (
              "Import Data"
            )}
          </div>
          <div className="z-10">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              id="fileInput"
              onChange={handleFileUpload}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleUploadFile}
                className="p-2 flex gap-2 items-center bg-blue-500/80 text-white hover:bg-blue-600/80 hover:translate-x-1 hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-md"
              >
                {isLoading ? (
                  <>
                    <FaCircleNotch
                      size={20}
                      color="#fff"
                      className="animate-spin"
                    />{" "}
                    Uploading
                  </>
                ) : (
                  <>
                    {excelData.length > 0 ? (
                      <>
                        <FaRotate size={20} color="#fff" /> Re-Upload
                      </>
                    ) : (
                      <>
                        <FaUpload size={20} color="#fff" /> Upload
                      </>
                    )}
                  </>
                )}
              </button>
              {isLoading
                ? excelData.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCancelUpload}
                      className="p-2 flex gap-2 items-center bg-yellow-500/80 text-white hover:bg-yellow-600/80 hover:translate-x-1 hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-md"
                    >
                      <FaXmark size={20} color="#fff" /> Cancel Upload
                    </button>
                  )
                : excelData.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 flex gap-2 items-center bg-red-500/80 text-white hover:bg-red-600/80 hover:translate-x-1 hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-md"
                    >
                      <FaTrashAlt size={20} color="#fff" /> Remove
                    </button>
                  )}
              {!isLoading && excelData.length > 0 && (
                <button
                  type="button"
                  disabled={isPrintLoading}
                  onClick={handlePrintCount}
                  className="p-2 hidden cursor-not-allowed gap-2 items-center bg-blue-500/80 text-white hover:bg-blue-600/80 hover:translate-x-1 hover:-translate-y-1 transition-all duration-300 ease-in-out rounded-md"
                >
                  {isPrintLoading ? (
                    <>
                      <FaCircleNotch
                        className="animate-spin"
                        size={20}
                        color="#fff"
                      />{" "}
                      Please wait...
                    </>
                  ) : (
                    <>
                      <FaCheckDouble size={20} color="#fff" /> Done Print
                    </>
                  )}
                </button>
              )}
            </div>
            {fileInfo.name && !isLoading && (
              <div className="mt-2">
                <p>
                  <strong>File Name:</strong> {fileInfo.name}
                </p>
                <p>
                  <strong>File Size:</strong> {fileInfo.size}
                </p>
              </div>
            )}
          </div>

          <div
            className={`absolute top-0 transition-all duration-100 ease-linear left-0 h-full -z-10 ${
              progress === 100
                ? "bg-green-100/70"
                : "bg-gradient-to-r from-[#005483] to-[#2eb2ff] opacity-20"
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div
          className={`w-full flex justify-end pr-5 ${
            isFileUploaded ? "py-2" : "py-4"
          } my-5 bg-[#dfe4eb]`}
        >
          {isFileUploaded && (
            <>
              <div>
                <button
                  type="button"
                  ref={buttonRef}
                  onClick={toggleDropdown}
                  className={`flex items-center gap-2 font-semibold ${
                    isLoading && "opacity-0"
                  }`}
                >
                  <FaPrint size={20} color="#333" />
                  Print Now
                </button>
              </div>
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute flex flex-col right-5 mt-10 bg-[#dfe4eb] border border-slate-200 shadow-xl z-50"
                >
                  {printOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={option.action}
                      className="px-2 text-center text-sm font-medium text-[#333] py-1 hover:bg-white"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {isLoading ? (
          <div className="text-blue-500 flex justify-center items-center h-32">
            <FaCircleNotch size={50} className="animate-spin" />
          </div>
        ) : excelData && excelData[0]?.length > 11 ? (
          excelData.slice(1).map((row, rowIndex, array) => (
            <div key={rowIndex} className="relative">
              <button
                type="button"
                id="button-for-hide"
                onClick={handleCloseTable(rowIndex)}
                className="absolute -top-[48px] left-3 rounded-lg bg-[#a1c1ed] px-2 py-0.5 hover:bg-[#8caad4]"
              >
                {isHideTable[rowIndex] ? (
                  <FaPlus size={13} color="#333" />
                ) : (
                  <FaMinus size={13} color="#333" />
                )}
              </button>
              <div
                className={`${
                  isHideTable[rowIndex]
                    ? "max-h-0 overflow-y-hidden"
                    : "max-h-[1000px] overflow-y-auto"
                } my-5 grid grid-cols-5 gap-3 text-sm text-[#333] px-10 transform transition-all duration-300 ease-in-out`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>Chassis Number</p>
                    <p className="font-semibold">
                      {row[chassisNumber] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Mainline Name</p>
                    <p className="font-semibold">
                      {row[mainLineName]
                        ?.replace(/Ã/g, "Ñ")
                        .replace(/Ã‘/g, "Ñ")
                        .replace(/Ã±/g, "ñ") || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Billing Address</p>
                    <p className="font-semibold">
                      {row[billingAddress] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Color</p>
                    <p className="font-semibold">{row[color] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Cashier</p>
                    <p className="font-semibold">
                      {row[cashier]
                        ?.replace(/Ã/g, "Ñ")
                        .replace(/Ã‘/g, "Ñ")
                        .replace(/Ã±/g, "ñ") || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>Tax Number</p>
                    <p className="font-semibold">{row[taxNumber] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Date</p>
                    <p className="font-semibold">{row[date] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Terms</p>
                    <p className="font-semibold">{row[terms] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Serial Number</p>
                    <p className="font-semibold">
                      {row[serialNumber] || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>Articles</p>
                    <p className="font-semibold">{row[articles] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Quantity</p>
                    <p className="font-semibold">
                      {row[quantity]?.replace(/.0$/, "") || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Unit of Measurement</p>
                    <p className="font-semibold">
                      {row[unitOfMeasurement] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Conduction Sticker</p>
                    <p className="font-semibold">
                      {row[conductionSticker] || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>OSCA/PWD ID No.</p>
                    <p className="font-semibold">{row[oscaPwdIdNo] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Business Style</p>
                    <p className="font-semibold">
                      {row[businessStyle] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Cardholder's Signature</p>
                    <p className="font-semibold">
                      {row[cardHolderSignatures] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Unit Price</p>
                    <p className="font-semibold">
                      {/* {FormattedNumber(row[totalAmount]) || "0.00"} */}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Amount</p>
                    <p className="font-semibold">
                      {FormattedNumber(row[quantity] * row[rateInclusiveVat]) ||
                        "0.00"}
                    </p>
                  </div>
                </div>
                <div>
                  <table>
                    <thead>
                      <tr className="bg-[#607799]">
                        <th colSpan={2} className="text-white p-2 text-left">
                          SUMMARY
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#f1f1f1]">
                      <tr>
                        <td className="text-left p-2">
                          Total Sales (VAT Inclusive)
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {FormattedNumber(row[totalSalesVatInclusive]) ||
                            "0.00"}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left p-2">Less: VAT</td>
                        <td className="text-right p-2 font-semibold">
                          {FormattedNumber(row[vatAmount]) || "0.00"}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left p-2">Amount: Net of VAT</td>
                        <td className="text-right p-2 font-semibold">
                          {FormattedNumber(row[totalSalesVatExclusive]) ||
                            "0.00"}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left p-2">Amount Due</td>
                        <td className="text-right p-2 font-semibold">
                          {FormattedNumber(row[totalSalesVatExclusive2]) ||
                            "0.00"}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left p-2">Add: VAT</td>
                        <td className="text-right p-2 font-semibold">
                          {FormattedNumber(row[vatAmount2]) || "0.00"}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left p-2">TOTAL AMOUNT DUE</td>
                        <td className="text-right p-2 font-semibold">
                          {FormattedNumber(row[totalSalesVatInclusive]) ||
                            "0.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div></div>
              </div>
              <div
                className={`w-full flex justify-end pr-5 py-5 my-5 bg-[#dfe4eb] 
                  ${
                    isHideTable[rowIndex] && rowIndex === array.length - 1
                      ? "hidden"
                      : ""
                  }
                  `}
              />
            </div>
          ))
        ) : excelData && excelData[0]?.length <= 11 ? (
          excelData.slice(1).map((row, rowIndex, array) => (
            <div key={rowIndex} className="relative">
              <button
                type="button"
                id="button-for-hide"
                onClick={handleCloseTable(rowIndex)}
                className="absolute -top-[48px] left-3 rounded-lg bg-[#a1c1ed] px-2 py-0.5 hover:bg-[#8caad4]"
              >
                {isHideTable[rowIndex] ? (
                  <FaPlus size={13} color="#333" />
                ) : (
                  <FaMinus size={13} color="#333" />
                )}
              </button>
              <div
                className={`${
                  isHideTable[rowIndex]
                    ? "max-h-0 overflow-y-hidden"
                    : "max-h-[1000px] overflow-y-auto"
                } my-5 grid grid-cols-5 gap-3 text-sm text-[#333] px-10 transform transition-all duration-300 ease-in-out`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>Customer Name</p>
                    <p className="font-semibold">{row[CR_Name] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Date</p>
                    <p className="font-semibold">{row[CR_Date] || "N/A"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>TIN</p>
                    <p className="font-semibold">{row[CR_TIN] || "N/A"}</p>
                  </div>
                  <div className="flex flex-col">
                    <p>Address</p>
                    <p className="font-semibold">{row[CR_Address] || "N/A"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>Business Style</p>
                    <p className="font-semibold">
                      {row[CR_BusinessStyle] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Memo</p>
                    <p className="font-semibold">{row[CR_Memo] || "N/A"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>Amount in Figures</p>
                    <p className="font-semibold">
                      {row[CR_AmountInFigures] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Amount in Words</p>
                    <p className="font-semibold">
                      {row[CR_AmountInWords] || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col">
                    <p>Form of Payment</p>
                    <p className="font-semibold">
                      {row[CR_FormOfPayment] || "N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p>Partner Name</p>
                    <p className="font-semibold">
                      {row[CR_PartnerName] || "N/A"}
                    </p>
                  </div>
                </div>
                <div></div>
              </div>
              <div
                className={`w-full flex justify-end pr-5 py-5 my-5 bg-[#dfe4eb] 
                  ${
                    isHideTable[rowIndex] && rowIndex === array.length - 1
                      ? "hidden"
                      : ""
                  }
                  `}
              />
            </div>
          ))
        ) : (
          <div className="flex justify-center my-5">
            <DragAndDropComponent
              setFileInfo={setFileInfo}
              setExcelData={setExcelData}
              setIsFileUploaded={setIsFileUploaded}
              handleUploadFile={handleUploadFile}
              setIsLoading={setIsLoading}
              setIsPrintCr={setIsPrintCr}
            />
          </div>
        )}
      </div>
      <BackToTop backToTop={backToTop} handleBackToTop={handleBackToTop} />
    </PrivateRoute>
  );
}
