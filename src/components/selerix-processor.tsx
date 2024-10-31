"use client";
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Download, Plus, Trash2 } from "lucide-react";

// Defines the structure for processing rules that determine how to populate health insurance fields
// Each rule maps a specific deduction code and employee amount to corresponding insurance details
type Rule = {
  deduction: string; // Deduction code from the CSV
  empAmount: string; // Employee amount/percentage (can be single value "0" or range "65-65.5")
  carrier: string; // Insurance carrier to be populated
  coverage: string; // Coverage type to be populated
  level: string; // Insurance level
  plan: string; // Insurance plan
};

// Defines the structure of each row in the CSV file
// Uses string indexing to allow dynamic access to properties
type CSVRow = {
  [key: string]: string; // Allows accessing properties using string keys
  SSN: string;
  "Empe Amt/Pct": string; // Employee amount/percentage
  "Empe Amt/Pct Montly": string; // Monthly employee amount/percentage
  "Start Date": string;
  Deduction: string; // Deduction code
  "End Date": string;
  "Hlth Ins Carrie": string; // Health insurance carrier (to be populated)
  "Hlth Ins Cvrage": string; // Health insurance coverage (to be populated)
  "Hlth Ins Level": string; // Health insurance level (to be populated)
  "Hlth Ins Plan": string; // Health insurance plan (to be populated)
  "Action Flag": string;
  EmployeeIdent: string;
};

// Validates if the amount string is in correct format
// Returns true if empty, a valid number, or a valid range (e.g., "65-65.5")
const isValidAmount = (amount: string): boolean => {
  if (!amount) return true;
  if (!isNaN(parseFloat(amount))) return true;
  const parts = amount.split("-");
  if (parts.length !== 2) return false;
  return !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
};

// Checks if a numeric value falls within the specified range or matches exact amount
// Handles both single values and ranges (e.g., "65" or "65-65.5")
const isWithinRange = (value: number, ruleAmount: string): boolean => {
  if (!ruleAmount.includes("-")) {
    return value === parseFloat(ruleAmount);
  }
  const [min, max] = ruleAmount.split("-").map(parseFloat);
  return value >= min && value <= max;
};

// Add this after the type definitions and before the component

// Define default rules based on VBA conditions
const defaultRules: Rule[] = [
  // Medical code 2400
  {
    deduction: "2400",
    empAmount: "65-65.5",
    carrier: "AETN",
    coverage: "1",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "299-299.5",
    carrier: "AETN",
    coverage: "10",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "494-494.5",
    carrier: "AETN",
    coverage: "2",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "645.67-645.5",
    carrier: "AETN",
    coverage: "3",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "992.33-992.5",
    carrier: "AETN",
    coverage: "4",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "125.67-125.8",
    carrier: "AETN",
    coverage: "90",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "368.33-368.5",
    carrier: "AETN",
    coverage: "94",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "563.33-563.5",
    carrier: "AETN",
    coverage: "91",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "715-715.5",
    carrier: "AETN",
    coverage: "92",
    level: "1",
    plan: "HLTH",
  },
  {
    deduction: "2400",
    empAmount: "1061.67-1061.8",
    carrier: "AETN",
    coverage: "93",
    level: "1",
    plan: "HLTH",
  },
  // Medical code 2401
  {
    deduction: "2401",
    empAmount: "0",
    carrier: "AETN",
    coverage: "1",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "199.33-199.5",
    carrier: "AETN",
    coverage: "10",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "264.33-264.5",
    carrier: "AETN",
    coverage: "2",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "351-351.1",
    carrier: "AETN",
    coverage: "3",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "567.67-567.8",
    carrier: "AETN",
    coverage: "4",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "60.67-60.8",
    carrier: "AETN",
    coverage: "90",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "260-260.1",
    carrier: "AETN",
    coverage: "94",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "325-325.1",
    carrier: "AETN",
    coverage: "91",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "411.67-411.8",
    carrier: "AETN",
    coverage: "92",
    level: "1",
    plan: "H-CD",
  },
  {
    deduction: "2401",
    empAmount: "628.33-628.5",
    carrier: "AETN",
    coverage: "93",
    level: "1",
    plan: "H-CD",
  },
  // Dental code 2410
  {
    deduction: "2410",
    empAmount: "33.5-33.59",
    carrier: "AMER",
    coverage: "5",
    level: "1",
    plan: "DENT",
  },
  {
    deduction: "2410",
    empAmount: "72.5-72.59",
    carrier: "AMER",
    coverage: "6",
    level: "1",
    plan: "DENT",
  },
  {
    deduction: "2410",
    empAmount: "112.6-112.69",
    carrier: "AMER",
    coverage: "7",
    level: "1",
    plan: "DENT",
  },
  // Vision code 2411
  {
    deduction: "2411",
    empAmount: "6.7-6.79",
    carrier: "STAN",
    coverage: "70",
    level: "1",
    plan: "VISS",
  },
  {
    deduction: "2411",
    empAmount: "13.1-13.19",
    carrier: "STAN",
    coverage: "71",
    level: "1",
    plan: "VISS",
  },
  {
    deduction: "2411",
    empAmount: "13.4-13.49",
    carrier: "STAN",
    coverage: "72",
    level: "1",
    plan: "VISS",
  },
  {
    deduction: "2411",
    empAmount: "20-20.05",
    carrier: "STAN",
    coverage: "73",
    level: "1",
    plan: "VISS",
  },
];

const SelerixProcessor = () => {
  // State management for the application
  const [csvData, setCsvData] = useState<CSVRow[]>([]); // Stores original CSV data
  const [processedData, setProcessedData] = useState<CSVRow[]>([]); // Stores processed CSV data
  const [rules, setRules] = useState<Rule[]>(defaultRules); // Stores processing rules
  const [loading, setLoading] = useState(false); // Loading state for async operations
  const [uniqueDeductions, setUniqueDeductions] = useState<string[]>([]); // Stores unique deduction codes from CSV
  const [uniqueAmounts, setUniqueAmounts] = useState<string[]>([]); // Stores unique amounts from CSV
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({}); // Stores validation errors for rules

  // Notification state for user feedback
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({ show: false, title: "", message: "", type: "success" });

  // Displays a notification message that automatically dismisses after 3 seconds
  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error"
  ) => {
    setNotification({ show: true, title, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handles CSV file upload and parsing
  // Extracts unique deduction codes and amounts for reference
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setLoading(true);
        const file = event.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const rows = text.split("\n");
        const headers = rows[0].split(",").map((h) => h.trim());

        // Parse CSV rows into objects using headers as keys
        const data = rows
          .slice(1)
          .filter((row) => row.trim() !== "") // Remove completely empty rows
          .map((row) => {
            const values = row.split(",");
            const rowObj = headers.reduce((obj, header, index) => {
              obj[header.trim()] = values[index]?.trim() || "";
              return obj;
            }, {} as CSVRow);
            // Only include rows that have at least one non-empty value
            const hasValues = Object.values(rowObj).some(
              (value) => value !== ""
            );
            return hasValues ? rowObj : null;
          })
          .filter((row): row is CSVRow => row !== null); // Remove any null rows

        // Extract unique deductions and amounts for reference
        const deductions = [
          ...new Set(data.map((row) => row.Deduction)),
        ].filter(Boolean);
        const amounts = [
          ...new Set(data.map((row) => row["Empe Amt/Pct"])),
        ].filter(Boolean);

        setUniqueDeductions(deductions);
        setUniqueAmounts(amounts);
        setCsvData(data);

        showNotification(
          "Success",
          `Loaded ${data.length} rows with ${deductions.length} unique deductions`,
          "success"
        );
      } catch (error) {
        showNotification(
          "Error",
          "Please check the file format and try again",
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Validates a single rule for completeness and correct format
  const validateRule = (rule: Rule): string[] => {
    const errors: string[] = [];
    if (!rule.deduction) errors.push("Deduction code is required");
    if (!isValidAmount(rule.empAmount))
      errors.push('Amount must be a number or range (e.g., "65" or "65-65.5")');
    if (!rule.carrier) errors.push("Carrier is required");
    if (!rule.coverage) errors.push("Coverage is required");
    return errors;
  };

  // Adds a new blank rule to the rules array
  const addRule = useCallback(() => {
    setRules((prev) => [
      ...prev,
      {
        deduction: "",
        empAmount: "",
        carrier: "",
        coverage: "",
        level: "1",
        plan: "",
      },
    ]);
  }, []);

  // Removes a rule at the specified index
  const removeRule = useCallback((index: number) => {
    setRules((rules) => rules.filter((_, i) => i !== index));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`rule-${index}`];
      return newErrors;
    });
  }, []);

  // Updates a specific field in a rule and validates the updated rule
  const updateRule = useCallback(
    (index: number, field: keyof Rule, value: string) => {
      setRules((rules) => {
        const newRules = [...rules];
        newRules[index][field] = value;
        const errors = validateRule(newRules[index]);
        setValidationErrors((prev) => ({
          ...prev,
          [`rule-${index}`]: errors.join(", "),
        }));
        return newRules;
      });
    },
    []
  );

  // Add utility function to convert bi-weekly to monthly amount
  const convertBiWeeklyToMonthly = (biWeeklyAmount: number): number => {
    return biWeeklyAmount * (26 / 12); // Multiply by 26/12 to convert bi-weekly to monthly
  };
  // Processes the CSV data using the defined rules
  // Validates all rules before processing
  const processData = useCallback(() => {
    try {
      setLoading(true);

      // Validate all rules before processing
      const allErrors = rules
        .map((rule, index) => ({
          index,
          errors: validateRule(rule),
        }))
        .filter((result) => result.errors.length > 0);

      if (allErrors.length > 0) {
        const errorMessages = allErrors.map(
          (error) => `Rule ${error.index + 1}: ${error.errors.join(", ")}`
        );
        throw new Error(`Validation errors:\n${errorMessages.join("\n")}`);
      }

      // Process each row according to matching rules
      const processed = csvData.map((row) => {
        // Create new row maintaining order of properties
        const newRow = Object.keys(row).reduce((acc, key) => {
          // If it's the amount column, rename it and set monthly value
          if (key === "Empe Amt/Pct") {
            const biWeeklyAmount = parseFloat(row[key]);
            const monthlyAmount = convertBiWeeklyToMonthly(biWeeklyAmount);
            acc["Empe Amt/Pct Montly"] = monthlyAmount.toFixed(2);
          } else {
            acc[key] = row[key];
          }
          return acc;
        }, {} as typeof row);

        // Find matching rule using the monthly amount for comparison
        const monthlyAmount = parseFloat(newRow["Empe Amt/Pct Montly"]);
        const matchingRule = rules.find(
          (rule) =>
            rule.deduction === row.Deduction &&
            isWithinRange(monthlyAmount, rule.empAmount)
        );

        // Apply matching rule to populate health insurance fields
        if (matchingRule) {
          newRow["Hlth Ins Carrie"] = matchingRule.carrier;
          newRow["Hlth Ins Cvrage"] = matchingRule.coverage;
          newRow["Hlth Ins Level"] = matchingRule.level;
          newRow["Hlth Ins Plan"] = matchingRule.plan;
        }

        return newRow;
      });

      setProcessedData(processed);
      showNotification(
        "Success",
        `Processed ${processed.length} rows of data. Bi-weekly amounts were converted to monthly for matching.`,
        "success"
      );
    } catch (error) {
      showNotification(
        "Error",
        error instanceof Error ? error.message : "Processing failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [csvData, rules]);

  // Creates and triggers download of processed data as CSV file
  const downloadCSV = useCallback(() => {
    try {
      if (processedData.length === 0) return;

      // Create CSV content with headers and data
      // Get headers but filter out any that are empty or only contain spaces
      const headers = Object.keys(processedData[0]).filter(
        (header) => header.trim() !== ""
      );
      const csvContent = [
        headers.join(","),
        ...processedData
          .filter((row) => Object.values(row).some((value) => value !== "")) // Filter out empty rows
          .map((row) =>
            headers
              .map((header) => {
                const value = row[header] || "";
                // Handle values that contain commas by wrapping in quotes
                return value.includes(",") ? `"${value}"` : value;
              })
              .join(",")
          ),
      ]
        .filter((row) => row.trim() !== "") // Extra safety check for empty rows
        .join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "processed_selerix_data.csv";
      a.click();
      window.URL.revokeObjectURL(url);

      showNotification(
        "Success",
        "Your processed data has been downloaded",
        "success"
      );
    } catch (error) {
      showNotification("Error", "Download failed", "error");
    }
  }, [processedData]);

  return (
    <div className="space-y-6 p-4">
      {notification.show && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-100 border-green-500"
              : "bg-red-100 border-red-500"
          } border`}
        >
          <h4 className="font-medium">{notification.title}</h4>
          <p className="text-sm">{notification.message}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selerix Data Processor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Upload Selerix CSV File
            </label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Processing Rules</h3>
              <Button onClick={addRule} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            {uniqueDeductions.length > 0 && (
              <Alert>
                <AlertTitle>Available Deduction Codes</AlertTitle>
                <AlertDescription>
                  {uniqueDeductions.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Deduction Code"
                      value={rule.deduction}
                      onChange={(e) =>
                        updateRule(index, "deduction", e.target.value)
                      }
                      className="flex-1"
                      list={`deductions-${index}`}
                    />
                    <Input
                      placeholder="Amount Range (e.g., 65-65.5)"
                      value={rule.empAmount}
                      onChange={(e) =>
                        updateRule(index, "empAmount", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Carrier"
                      value={rule.carrier}
                      onChange={(e) =>
                        updateRule(index, "carrier", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Coverage"
                      value={rule.coverage}
                      onChange={(e) =>
                        updateRule(index, "coverage", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Level"
                      value={rule.level}
                      onChange={(e) =>
                        updateRule(index, "level", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Plan"
                      value={rule.plan}
                      onChange={(e) =>
                        updateRule(index, "plan", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {validationErrors[`rule-${index}`] && (
                    <div className="text-sm text-red-500">
                      {validationErrors[`rule-${index}`]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={processData}
              disabled={!csvData.length || !rules.length || loading}
              className="w-32"
            >
              <Upload className="w-4 h-4 mr-2" />
              Process
            </Button>
            <Button
              onClick={downloadCSV}
              disabled={!processedData.length}
              variant="outline"
              className="w-32"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {processedData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Preview</h3>
              <div className="border rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(processedData[0]).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((value, colIndex) => (
                          <td
                            key={colIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SelerixProcessor;
