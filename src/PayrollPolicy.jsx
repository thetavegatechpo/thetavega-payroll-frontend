

import React, { useEffect, useState } from "react";

import { api, errorText } from "./api";

import {

  Settings2,

  ShieldCheck,

  Users,

  Save,

  ChevronDown,

  ChevronUp,

  CheckCircle2,

  AlertCircle,


  IndianRupee,

  Info,

  History,

  RefreshCw,

  LockKeyhole,

} from "lucide-react";



const initial = {

  code: "STANDARD",


  employeePfRate: 12,

  employerPfRate: 12,

  employeeEsicRate: 0.75,

  employerEsicRate: 3.25,

  esicWageCeiling: 21000,

  ptAmount: 200,
  insuranceAmount: 0,
  outstationFreeDays: 3,
  outstationGrossPercent: 20,

  casualLeaveAccrual: 1,
  earlyLeaveFreeCount: 2,
  earlyLeavePenaltyPercent: 25,

  lateMarksPerPenalty: 1,

  latePenaltyDays: 0.25,

  enabled: true,

};



const emptyEligibility = {

  pf: false,

  esic: false,

  pt: false,
  insurance: false,

  tds: false,

  tdsPercent: 0,

};






const money = (amount) =>

  Number(amount || 0).toLocaleString("en-IN", {

    style: "currency",

    currency: "INR",

    minimumFractionDigits: 2,

  });



function Switch({ checked, onChange, disabled = false }) {

  return (

    <button

      type="button"

      role="switch"

      aria-checked={checked}

      disabled={disabled}

      onClick={() => onChange(!checked)}

      className={`pp-switch ${checked ? "on" : ""}`}

    >

      <span />

    </button>

  );

}



function Field({

  label,

  value,

  onChange,

  suffix,

  type = "number",

  step = "any",

  min = "0",

  hint,

  required = true,

}) {

  return (

    <label className="pp-field">

      <span>{label}</span>



      <div className="pp-input-wrap">

        <input

          type={type}

          value={value}

          step={type === "number" ? step : undefined}

          min={type === "number" ? min : undefined}

          required={required}

          onChange={(e) =>

            onChange(

              type === "number"

                ? Number(e.target.value)

                : e.target.value

            )

          }

        />



        {suffix && <b>{suffix}</b>}

      </div>



      {hint && <small>{hint}</small>}

    </label>

  );

}



function SectionHeader({ icon: Icon, title, description }) {

  return (

    <div className="pp-section-header">

      <div className="pp-section-icon">

        <Icon size={19} />

      </div>



      <div>

        <h2>{title}</h2>

        <p>{description}</p>

      </div>

    </div>

  );

}



export default function PayrollPolicy() {

  const [form, setForm] = useState(initial);



  const [policies, setPolicies] = useState([]);

  const [employees, setEmployees] = useState([]);



  const [employee, setEmployee] = useState("");

  const [elig, setElig] = useState(emptyEligibility);



  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [savingEligibility, setSavingEligibility] =

    useState(false);



  const [eligibilityLoading, setEligibilityLoading] =

    useState(false);



  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);



  const [error, setError] = useState("");

  const [message, setMessage] = useState("");



  const update = (key, value) => {

    setForm((previous) => ({

      ...previous,

      [key]: value,

    }));

  };



  const updateEligibility = (key, value) => {

    setElig((previous) => ({

      ...previous,

      [key]: value,

    }));

  };



  async function loadPolicies(setLatest = false) {

    const { data } = await api.get(

      "/payroll-policy/policies"

    );



    const list = Array.isArray(data) ? data : [];



    setPolicies(list);



    if (setLatest && list.length) {

      // Prefer the latest enabled policy.

      const latest =

        list.find((p) => p.enabled) || list[0];



      setForm({

        code: latest.code ?? initial.code,

        employeePfRate:

          latest.employeePfRate ??

          initial.employeePfRate,

        employerPfRate:

          latest.employerPfRate ??

          initial.employerPfRate,

        employeeEsicRate:

          latest.employeeEsicRate ??

          initial.employeeEsicRate,

        employerEsicRate:

          latest.employerEsicRate ??

          initial.employerEsicRate,

        esicWageCeiling:

          latest.esicWageCeiling ??

          initial.esicWageCeiling,

        insuranceAmount: latest.insuranceAmount ?? 0,
        outstationFreeDays: latest.outstationFreeDays ?? 3,
        outstationGrossPercent: latest.outstationGrossPercent ?? 20,
        ptAmount:

          latest.ptAmount ??

          initial.ptAmount,

        earlyLeaveFreeCount: latest.earlyLeaveFreeCount ?? 2,
        earlyLeavePenaltyPercent: latest.earlyLeavePenaltyPercent ?? 25,
        casualLeaveAccrual:

          latest.casualLeaveAccrual ??

          initial.casualLeaveAccrual,

        lateMarksPerPenalty:

          latest.lateMarksPerPenalty ??

          initial.lateMarksPerPenalty,

        latePenaltyDays:

          latest.latePenaltyDays ??

          initial.latePenaltyDays,

        enabled: latest.enabled !== false,

      });

    }



    return list;

  }



  useEffect(() => {

    let active = true;



    async function load() {

      setLoading(true);



      try {

        const [policyResponse, employeeResponse] =

          await Promise.all([

            api.get("/payroll-policy/policies"),

            api.get("/employees?limit=100"),

          ]);



        if (!active) return;



        const list = Array.isArray(

          policyResponse.data

        )

          ? policyResponse.data

          : [];



        setPolicies(list);



        setEmployees(

          employeeResponse.data.data || []

        );



        if (list.length) {

          const latest =

            list.find((p) => p.enabled) || list[0];



          setForm({

            code: latest.code ?? initial.code,

            employeePfRate:

              latest.employeePfRate ??

              initial.employeePfRate,

            employerPfRate:

              latest.employerPfRate ??

              initial.employerPfRate,

            employeeEsicRate:

              latest.employeeEsicRate ??

              initial.employeeEsicRate,

            employerEsicRate:

              latest.employerEsicRate ??

              initial.employerEsicRate,

            esicWageCeiling:

              latest.esicWageCeiling ??

              initial.esicWageCeiling,

            insuranceAmount: latest.insuranceAmount ?? 0,
        outstationFreeDays: latest.outstationFreeDays ?? 3,
        outstationGrossPercent: latest.outstationGrossPercent ?? 20,
        ptAmount:

              latest.ptAmount ??

              initial.ptAmount,

            earlyLeaveFreeCount: latest.earlyLeaveFreeCount ?? 2,
        earlyLeavePenaltyPercent: latest.earlyLeavePenaltyPercent ?? 25,
        casualLeaveAccrual:

              latest.casualLeaveAccrual ??

              initial.casualLeaveAccrual,

            lateMarksPerPenalty:

              latest.lateMarksPerPenalty ??

              initial.lateMarksPerPenalty,

            latePenaltyDays:

              latest.latePenaltyDays ??

              initial.latePenaltyDays,

            enabled: latest.enabled !== false,

          });

        }

      } catch (e) {

        if (active) setError(errorText(e));

      } finally {

        if (active) setLoading(false);

      }

    }



    load();



    return () => {

      active = false;

    };

  }, []);



  useEffect(() => {

    let active = true;



    setElig({ ...emptyEligibility });

    setEligibilityLoading(Boolean(employee));



    if (!employee) return;



    api

      .get(

        `/payroll-policy/eligibility/${employee}`

      )

      .then(({ data }) => {

        if (!active) return;



        setElig({

          pf: Boolean(data.pf),

          esic: Boolean(data.esic),

          pt: Boolean(data.pt),
          insurance: Boolean(data.insurance),

          tds: Boolean(data.tds),

          tdsPercent:

            Number(data.tdsPercent) || 0,

        });

      })

      .catch((e) => {

        if (active) setError(errorText(e));

      })

      .finally(() => {

        if (active) setEligibilityLoading(false);

      });



    return () => {

      active = false;

    };

  }, [employee]);



  async function savePolicy(e) {

    e.preventDefault();



    setError("");

    setMessage("");



    if (!form.code.trim()) {

      setError("Enter a policy code.");

      return;

    }



    setSaving(true);



    try {

      const payload = {

        code: form.code.trim().toUpperCase(),




        employeePfRate:

          Number(form.employeePfRate),



        employerPfRate:

          Number(form.employerPfRate),



        employeeEsicRate:

          Number(form.employeeEsicRate),



        employerEsicRate:

          Number(form.employerEsicRate),



        esicWageCeiling:

          Number(form.esicWageCeiling),



        insuranceAmount: Number(form.insuranceAmount),
        outstationFreeDays: Number(form.outstationFreeDays),
        outstationGrossPercent: Number(form.outstationGrossPercent),
        ptAmount:

          Number(form.ptAmount),



        earlyLeaveFreeCount: Number(form.earlyLeaveFreeCount),
        earlyLeavePenaltyPercent: Number(form.earlyLeavePenaltyPercent),
        casualLeaveAccrual:

          Number(form.casualLeaveAccrual),



        // Preserving existing payroll rule fields.

        lateMarksPerPenalty:

          Number(form.lateMarksPerPenalty),



        latePenaltyDays:

          Number(form.latePenaltyDays),



        enabled: Boolean(form.enabled),

      };



      await api.post(

        "/payroll-policy/policies",

        payload

      );



      await loadPolicies(false);



      setMessage(

        "Payroll settings saved as a new policy version."

      );

    } catch (e) {

      setError(errorText(e));

    } finally {

      setSaving(false);

    }

  }



  async function saveEligibility() {

    if (!employee) {

      setError("Please select an employee.");

      return;

    }



    setError("");

    setMessage("");

    setSavingEligibility(true);



    try {

      await api.put(

        `/payroll-policy/eligibility/${employee}`,

        {

          pf: Boolean(elig.pf),

          esic: Boolean(elig.esic),

          pt: Boolean(elig.pt),
          insurance: Boolean(elig.insurance),

          tds: Boolean(elig.tds),

          tdsPercent:

            Number(elig.tdsPercent) || 0,

        }

      );



      setMessage(

        "Employee statutory eligibility saved successfully."

      );

    } catch (e) {

      setError(errorText(e));

    } finally {

      setSavingEligibility(false);

    }

  }



  const selectedEmployee = employees.find(

    (e) => e._id === employee

  );



  return (

    <div className="pp-page">

      <div className="pp-heading">

        <div>

          <div className="pp-eyebrow">

            PAYROLL CONFIGURATION

          </div>



          <h1>Payroll Settings</h1>



          <p>

            Manage salary rules and employee

            statutory applicability.

          </p>

        </div>



        <div className="pp-heading-icon">

          <Settings2 size={23} />

        </div>

      </div>



      {error && (

        <div className="pp-alert pp-error">

          <AlertCircle size={18} />

          <span>{error}</span>

        </div>

      )}



      {message && (

        <div className="pp-alert pp-success">

          <CheckCircle2 size={18} />

          <span>{message}</span>

        </div>

      )}



      {loading ? (

        <div className="pp-panel">

          Loading payroll settings...

        </div>

      ) : (

        <>

          <form onSubmit={savePolicy}>

            <div className="pp-panel">

              <div className="pp-policy-top">

                <SectionHeader

                  icon={ShieldCheck}

                  title="Statutory & Salary Rules"

                  description="Simple settings used during payroll calculation"

                />



                <span className="pp-tag">

                  {form.enabled

                    ? "ACTIVE POLICY"

                    : "INACTIVE POLICY"}

                </span>

              </div>



              <div className="pp-card-title">

                Provident Fund (PF)

              </div>



              <div className="pp-grid">

                <Field

                  label="Employee PF"

                  value={form.employeePfRate}

                  suffix="%"

                  onChange={(value) =>

                    update("employeePfRate", value)

                  }

                />



                <Field

                  label="Employer PF"

                  value={form.employerPfRate}

                  suffix="%"

                  onChange={(value) =>

                    update("employerPfRate", value)

                  }

                />

              </div>



              <div className="pp-note">

                <Info size={15} />

                <span>

                  PF uses earned Basic Salary.

                  Employer PF is accounted for

                  separately within CTC.

                </span>

              </div>



              <div className="pp-divider" />



              <div className="pp-card-title">

                Professional Tax

              </div>



              <div className="pp-grid">

                <Field label="Company Insurance / Month" value={form.insuranceAmount} suffix="₹" onChange={value=>update("insuranceAmount",value)}/>
                <Field label="Outstation Free Days / Trip" value={form.outstationFreeDays} step="1" suffix="days" onChange={value=>update("outstationFreeDays",value)}/>
                <Field label="Outstation Allowance" value={form.outstationGrossPercent} suffix="% of daily Gross" onChange={value=>update("outstationGrossPercent",value)}/>
                <Field

                  label="Professional Tax"

                  value={form.ptAmount}

                  suffix="₹"

                  onChange={(value) =>

                    update("ptAmount", value)

                  }

                />



                <Field

                  label="Paid Casual Leave / Month"

                  value={form.casualLeaveAccrual}

                  suffix="days"

                  onChange={(value) =>

                    update(

                      "casualLeaveAccrual",

                      value

                    )

                  }

                />

              </div>



              <div className="pp-divider" />



              <div className="pp-card-title">

                Attendance Deduction Rules

              </div>



              <div className="pp-grid">
                <Field label="Free Early Leaves / Month" value={form.earlyLeaveFreeCount} step="1" onChange={value=>update("earlyLeaveFreeCount",value)} suffix="times" />
                <Field label="Early Leave Penalty" value={form.earlyLeavePenaltyPercent} onChange={value=>update("earlyLeavePenaltyPercent",value)} suffix="% of daily Gross" />
              </div>
              <div className="pp-rules">

                <div className="pp-rule">

                  <div>

                    <strong>Late Mark Deduction</strong>

                    <span>Per late mark</span>

                  </div>

                  <b>0.25 day</b>

                </div>



                <div className="pp-rule">

                  <div>

                    <strong>Half-Day Deduction</strong>

                    <span>Per half day</span>

                  </div>

                  <b>0.50 day</b>

                </div>



                <div className="pp-rule">

                  <div>

                    <strong>Approved Overtime</strong>

                    <span>Added to payable days</span>

                  </div>

                  <b>Enabled</b>

                </div>

              </div>



              <div className="pp-divider" />



              <button

                type="button"

                className="pp-expand"

                onClick={() =>

                  setAdvancedOpen(!advancedOpen)

                }

              >

                <span>

                  <Settings2 size={17} />

                  Advanced Statutory Settings

                </span>



                {advancedOpen ? (

                  <ChevronUp size={18} />

                ) : (

                  <ChevronDown size={18} />

                )}

              </button>



              {advancedOpen && (

                <div className="pp-advanced">

                  <div className="pp-grid">

                    <Field

                      label="Employee ESIC"

                      value={form.employeeEsicRate}

                      suffix="%"

                      onChange={(value) =>

                        update(

                          "employeeEsicRate",

                          value

                        )

                      }

                    />



                    <Field

                      label="Employer ESIC"

                      value={form.employerEsicRate}

                      suffix="%"

                      onChange={(value) =>

                        update(

                          "employerEsicRate",

                          value

                        )

                      }

                    />



                    <Field

                      label="ESIC Wage Ceiling"

                      value={form.esicWageCeiling}

                      suffix="₹"

                      onChange={(value) =>

                        update(

                          "esicWageCeiling",

                          value

                        )

                      }

                    />



                    <Field

                      label="Policy Code"

                      value={form.code}

                      type="text"

                      onChange={(value) =>

                        update("code", value)

                      }

                    />

                  </div>



                  <div className="pp-rule">

                    <div>

                      <strong>Policy Enabled</strong>

                      <span>

                        Save an active or inactive

                        policy version

                      </span>

                    </div>



                    <Switch

                      checked={form.enabled}

                      onChange={(value) =>

                        update("enabled", value)

                      }

                    />

                  </div>



                  <div className="pp-note">

                    <Info size={15} />

                    <span>

                      Advanced fields are preserved

                      in the saved policy. Ensure ESIC

                      settings are legally applicable

                      before using them for live payroll.

                    </span>

                  </div>

                </div>

              )}



              <div className="pp-footer-actions">



                <button

                  type="submit"

                  className="pp-primary"

                  disabled={saving}

                >

                  <Save size={16} />

                  {saving

                    ? "Saving..."

                    : "Save Payroll Settings"}

                </button>

              </div>



              <div className="pp-version-note">

                Saving creates a new policy version.

                Existing approved payroll records

                are not recalculated.

              </div>

            </div>

          </form>



          <div className="pp-panel">

            <SectionHeader

              icon={Users}

              title="Employee Statutory Eligibility"

              description="Choose which deductions apply to each employee"

            />



            <label className="pp-field">

              <span>Select Employee</span>



              <select

                value={employee}

                onChange={(e) => {

                  setEmployee(e.target.value);

                  setError("");

                  setMessage("");

                }}

              >

                <option value="">

                  Select an employee

                </option>



                {employees.map((e) => (

                  <option

                    key={e._id}

                    value={e._id}

                  >

                    {e.employeeCode} —{" "}

                    {e.firstName} {e.lastName}

                  </option>

                ))}

              </select>

            </label>



            {employee ? (

              eligibilityLoading ? (

                <div className="pp-note">

                  Loading eligibility...

                </div>

              ) : (

                <>

                  <div className="pp-employee">

                    <div className="pp-avatar">

                      {selectedEmployee?.firstName?.[0]}

                      {selectedEmployee?.lastName?.[0]}

                    </div>



                    <div>

                      <strong>

                        {selectedEmployee?.firstName}{" "}

                        {selectedEmployee?.lastName}

                      </strong>



                      <span>

                        {selectedEmployee?.employeeCode}

                      </span>

                    </div>

                  </div>



                  <div className="pp-eligibility-list">

                    {[

                      {

                        key: "pf",

                        title: "Provident Fund",

                        description:

                          "Employee and employer PF",

                      },

                      {

                        key: "esic",

                        title: "ESIC",

                        description:

                          "Applicable insurance contributions",

                      },

                      {

                        key: "pt",

                        title: "Professional Tax",

                        description:

                          "Deduct configured PT amount",

                      },

                      {

                        key: "insurance",
                        title: "Company Insurance",
                        description: "Employee premium when applicable",
                      },
                      {
                        key: "tds",

                        title: "Income Tax (TDS)",

                        description:

                          "Deduct approved monthly TDS",

                      },

                    ].map((item) => (

                      <div

                        className="pp-eligibility-row"

                        key={item.key}

                      >

                        <div>

                          <strong>{item.title}</strong>

                          <span>

                            {item.description}

                          </span>

                        </div>



                        <Switch

                          checked={elig[item.key]}

                          onChange={(value) =>

                            updateEligibility(

                              item.key,

                              value

                            )

                          }

                        />

                      </div>

                    ))}

                  </div>



                  {elig.tds && (

                    <div className="pp-tds">

                      <Field

                        label="Monthly TDS Rate"

                        value={

                          elig.tdsPercent

                        }

                        suffix="%"

                        onChange={(value) =>

                          updateEligibility(

                            "tdsPercent",

                            value

                          )

                        }

                      />

                    </div>

                  )}



                  <div className="pp-footer-actions">

                    <span className="pp-helper">

                      Changes apply to subsequent

                      payroll calculations.

                    </span>



                    <button

                      type="button"

                      className="pp-primary"

                      disabled={savingEligibility}

                      onClick={saveEligibility}

                    >

                      <Save size={16} />

                      {savingEligibility

                        ? "Saving..."

                        : "Save Eligibility"}

                    </button>

                  </div>

                </>

              )

            ) : (

              <div className="pp-empty">

                <Users size={26} />

                <strong>No employee selected</strong>

                <span>

                  Select an employee to configure

                  PF, ESIC, PT and TDS.

                </span>

              </div>

            )}

          </div>



          <div className="pp-panel">

            <button

              className="pp-expand"

              type="button"

              onClick={() =>

                setHistoryOpen(!historyOpen)

              }

            >

              <span>

                <History size={18} />

                Existing Policy Versions

                <em>{policies.length}</em>

              </span>



              {historyOpen ? (

                <ChevronUp size={18} />

              ) : (

                <ChevronDown size={18} />

              )}

            </button>



            {historyOpen && (

              <div className="pp-history">

                <div className="pp-table-wrap">

                  <table>

                    <thead>

                      <tr>

                        <th>Policy</th>

                        <th>Effective From</th>

                        <th>Employee PF</th>

                        <th>Employer PF</th>

                        <th>ESIC</th>

                        <th>PT</th>

                        <th>Status</th>

                      </tr>

                    </thead>



                    <tbody>

                      {policies.map((p) => (

                        <tr key={p._id}>

                          <td>

                            <strong>{p.code}</strong>

                          </td>



                          <td>

                            {p.employeePfRate}%

                          </td>



                          <td>

                            {p.employerPfRate}%

                          </td>



                          <td>

                            {p.employeeEsicRate}%

                          </td>



                          <td>

                            {money(p.ptAmount)}

                          </td>



                          <td>

                            <span

                              className={

                                p.enabled

                                  ? "pp-status active"

                                  : "pp-status"

                              }

                            >

                              {p.enabled

                                ? "Active"

                                : "Inactive"}

                            </span>

                          </td>

                        </tr>

                      ))}



                      {!policies.length && (

                        <tr>

                          <td colSpan={6}>

                            No policies saved.

                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </div>

        </>

      )}



      <style>{`

        .pp-page {

          color: #183044;

          padding-bottom: 32px;

        }



        .pp-page * {

          box-sizing: border-box;

        }



        .pp-heading {

          display: flex;

          justify-content: space-between;

          align-items: center;

          gap: 16px;

          margin-bottom: 24px;

        }



        .pp-eyebrow {

          color: #e78025;

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 1.5px;

        }



        .pp-heading h1 {

          font-size: 29px;

          font-weight: 800;

          margin: 7px 0;

          letter-spacing: -0.8px;

        }



        .pp-heading p {

          color: #8b99a6;

          font-size: 13px;

          margin: 0;

        }



        .pp-heading-icon {

          width: 44px;

          height: 44px;

          border-radius: 13px;

          display: grid;

          place-items: center;

          background: #fff0e1;

          color: #e78025;

        }



        .pp-panel {

          background: white;

          border: 1px solid #e5ebf0;

          border-radius: 17px;

          padding: 26px;

          margin-bottom: 19px;

          box-shadow: 0 5px 22px #142b3908;

        }



        .pp-policy-top {

          display: flex;

          justify-content: space-between;

          gap: 12px;

          flex-wrap: wrap;

        }



        .pp-section-header {

          display: flex;

          align-items: center;

          gap: 13px;

          margin-bottom: 24px;

        }



        .pp-section-icon {

          width: 43px;

          height: 43px;

          border-radius: 12px;

          background: #fff2e5;

          color: #ed8425;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-shrink: 0;

        }



        .pp-section-header h2 {

          font-size: 16px;

          margin: 0 0 5px;

          letter-spacing: -0.3px;

        }



        .pp-section-header p {

          color: #8b99a5;

          font-size: 12px;

          margin: 0;

        }



        .pp-tag {

          font-size: 10px;

          color: #16815f;

          background: #e7f7ef;

          border-radius: 30px;

          padding: 7px 12px;

          font-weight: 800;

          align-self: flex-start;

        }



        .pp-card-title {

          font-size: 13px;

          font-weight: 800;

          margin: 8px 0 15px;

        }



        .pp-grid {

          display: grid;

          grid-template-columns: repeat(2,minmax(0,1fr));

          gap: 17px;

        }



        .pp-field {

          display: flex;

          flex-direction: column;

          gap: 8px;

          min-width: 0;

          font-size: 12px;

          font-weight: 700;

          color: #526677;

        }



        .pp-field input,

        .pp-field select {

          width: 100%;

          min-height: 43px;

          padding: 11px 12px;

          border: 1px solid #dfe7ed;

          border-radius: 10px;

          background: #f9fbfc;

          color: #243c4d;

          font-size: 13px;

          outline: none;

        }



        .pp-field input:focus,

        .pp-field select:focus {

          border-color: #f28a28;

          background: white;

          box-shadow: 0 0 0 3px #f28a2815;

        }



        .pp-field small {

          color: #96a4b0;

          font-size: 10px;

          font-weight: 400;

        }



        .pp-input-wrap {

          position: relative;

        }



        .pp-input-wrap input {

          padding-right: 48px;

        }



        .pp-input-wrap b {

          position: absolute;

          top: 50%;

          right: 13px;

          transform: translateY(-50%);

          font-size: 11px;

          color: #8c9ba8;

        }



        .pp-divider {

          height: 1px;

          background: #edf1f4;

          margin: 25px 0;

        }



        .pp-note {

          display: flex;

          gap: 9px;

          align-items: flex-start;

          background: #f3f8fa;

          border-radius: 10px;

          color: #718b9a;

          padding: 12px 14px;

          font-size: 11px;

          line-height: 1.6;

          margin-top: 15px;

        }



        .pp-note svg {

          flex-shrink: 0;

          margin-top: 1px;

          color: #3489a1;

        }



        .pp-rules {

          display: grid;

          gap: 9px;

        }



        .pp-rule,

        .pp-eligibility-row {

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 16px;

          border: 1px solid #edf1f4;

          border-radius: 11px;

          padding: 14px 16px;

          background: #fafcfd;

        }



        .pp-rule strong,

        .pp-eligibility-row strong {

          display: block;

          font-size: 12px;

          color: #294254;

        }



        .pp-rule span,

        .pp-eligibility-row span {

          display: block;

          font-size: 11px;

          color: #97a5b0;

          margin-top: 5px;

        }



        .pp-rule > b {

          font-size: 12px;

          color: #167e61;

          white-space: nowrap;

        }



        .pp-expand {

          display: flex;

          width: 100%;

          align-items: center;

          justify-content: space-between;

          gap: 10px;

          padding: 5px 0;

          border: 0;

          background: none;

          color: #344e60;

          cursor: pointer;

          font-weight: 750;

          font-size: 12px;

          text-align: left;

        }



        .pp-expand > span {

          display: flex;

          align-items: center;

          gap: 9px;

        }



        .pp-expand em {

          font-style: normal;

          font-size: 10px;

          padding: 4px 8px;

          background: #f1f5f7;

          border-radius: 20px;

          color: #778996;

        }



        .pp-advanced {

          padding-top: 20px;

        }



        .pp-advanced .pp-rule {

          margin-top: 18px;

        }



        .pp-footer-actions {

          display: flex;

          align-items: center;

          justify-content: space-between;

          flex-wrap: wrap;

          gap: 15px;

          margin-top: 25px;

        }



        .pp-effective {

          color: #82919f;

          display: flex;

          align-items: center;

          gap: 8px;

          font-size: 11px;

        }



        .pp-primary {

          display: flex;

          justify-content: center;

          align-items: center;

          gap: 9px;

          padding: 13px 20px;

          border: 0;

          border-radius: 10px;

          background: #f28a28;

          color: white;

          font-weight: 750;

          font-size: 12px;

          cursor: pointer;

        }



        .pp-primary:hover {

          background: #e47a18;

        }



        .pp-primary:disabled {

          opacity: 0.55;

          cursor: not-allowed;

        }



        .pp-version-note {

          margin-top: 15px;

          font-size: 10px;

          color: #9aa7b1;

        }



        .pp-switch {

          flex-shrink: 0;

          width: 43px;

          height: 24px;

          border: 0;

          padding: 3px;

          border-radius: 20px;

          background: #cbd5dc;

          transition: background 0.2s;

          cursor: pointer;

        }



        .pp-switch span {

          width: 18px;

          height: 18px;

          display: block;

          border-radius: 50%;

          background: white;

          transition: transform 0.2s;

          box-shadow: 0 1px 4px #0002;

        }



        .pp-switch.on {

          background: #20a678;

        }



        .pp-switch.on span {

          transform: translateX(19px);

        }



        .pp-employee {

          display: flex;

          gap: 11px;

          align-items: center;

          margin: 17px 0;

          padding: 13px;

          background: #f5f8fa;

          border-radius: 12px;

        }



        .pp-avatar {

          width: 43px;

          height: 43px;

          display: grid;

          place-items: center;

          background: #ffe9d6;

          color: #d77925;

          font-weight: 800;

          border-radius: 12px;

        }



        .pp-employee strong {

          display: block;

          font-size: 12px;

        }



        .pp-employee span {

          display: block;

          font-size: 10px;

          color: #90a0ac;

          margin-top: 5px;

        }



        .pp-eligibility-list {

          display: grid;

          gap: 10px;

        }



        .pp-tds {

          max-width: 300px;

          margin-top: 19px;

        }



        .pp-helper {

          font-size: 11px;

          color: #8493a0;

        }



        .pp-empty {

          min-height: 160px;

          border: 1px dashed #dce6ec;

          border-radius: 12px;

          display: flex;

          flex-direction: column;

          align-items: center;

          justify-content: center;

          gap: 9px;

          margin-top: 19px;

          color: #9dabb6;

        }



        .pp-empty strong {

          color: #526979;

          font-size: 13px;

        }



        .pp-empty span {

          font-size: 11px;

          text-align: center;

        }



        .pp-alert {

          display: flex;

          align-items: center;

          gap: 9px;

          padding: 13px 16px;

          border-radius: 10px;

          margin-bottom: 15px;

          font-size: 12px;

        }



        .pp-error {

          background: #fff0ee;

          color: #be493e;

        }



        .pp-success {

          background: #eaf8f0;

          color: #168159;

        }



        .pp-history {

          padding-top: 20px;

        }



        .pp-table-wrap {

          overflow-x: auto;

        }



        .pp-table-wrap table {

          width: 100%;

          border-collapse: collapse;

          white-space: nowrap;

        }



        .pp-table-wrap th {

          background: #f7f9fa;

          color: #8b99a6;

          font-size: 10px;

          padding: 13px;

          text-align: left;

        }



        .pp-table-wrap td {

          padding: 14px 13px;

          border-bottom: 1px solid #edf1f4;

          font-size: 12px;

        }



        .pp-status {

          border-radius: 20px;

          padding: 6px 10px;

          background: #f0f2f4;

          color: #7b8995;

          font-size: 10px;

          font-weight: 800;

        }



        .pp-status.active {

          background: #e5f7ed;

          color: #13835e;

        }



        @media(max-width:700px) {

          .pp-panel {

            padding: 18px;

          }



          .pp-grid {

            grid-template-columns: 1fr;

          }



          .pp-heading h1 {

            font-size: 24px;

          }



          .pp-footer-actions {

            flex-direction: column;

            align-items: stretch;

          }



          .pp-primary {

            width: 100%;

          }

        }

      `}</style>

    </div>

  );

}
