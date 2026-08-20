import React from 'react';

interface CertHeaderProps {
  title: string;
  subTitle?: string;
  docNo: string;
  inspectionDate: string;
  inspector: string;
  approver: string;
  isPassed?: boolean;
}

export const CertHeader: React.FC<CertHeaderProps> = ({
  title,
  subTitle,
  docNo,
  inspectionDate,
  inspector,
  approver,
  isPassed = true
}) => {
  return (
    <div className="w-full select-none">
      {/* Top Document Title Bar */}
      <div className="flex justify-between items-end text-[13px] font-sans font-bold text-slate-900 pb-1">
        <div>JUNSUNG TECH Co., Ltd</div>
        <div className="font-mono text-[12px] font-normal">
          Document number : <span className="font-bold">{docNo}</span>
        </div>
      </div>

      {/* Main Header Bordered Box */}
      <div className="border-[1.5px] border-slate-950 flex justify-between items-stretch">
        {/* Left: JS Logo & Certificate Title */}
        <div className="flex-1 flex items-center px-4 py-2 gap-4">
          {/* JS Oval Logo Vector */}
          <div className="w-24 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 160 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="78" cy="40" rx="72" ry="36" stroke="#0284c7" strokeWidth="6" fill="white" />
              <path
                d="M32 30 C32 18, 55 16, 68 28 C74 34, 76 46, 64 56 C52 66, 36 62, 34 46"
                stroke="#0369a1"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M48 24 L48 46 C48 54, 40 58, 34 54"
                stroke="#0284c7"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M86 52 C94 58, 110 59, 118 52 C126 45, 122 36, 108 34 C94 32, 90 25, 96 18 C102 11, 118 12, 126 18"
                stroke="#0284c7"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Title Text */}
          <div className="flex-1 text-center pr-4">
            <h1 className="text-[26px] font-black tracking-[0.15em] text-slate-950 font-serif">
              {title}
            </h1>
            {subTitle && (
              <h2 className="text-[19px] font-black tracking-widest text-slate-950 mt-0.5">
                {subTitle}
              </h2>
            )}
          </div>
        </div>

        {/* Right: 4-Column Sign-Off Approval Box */}
        <div className="border-l-[1.5px] border-slate-950 flex shrink-0">
          {/* Column 1: 검사일 */}
          <div className="w-[85px] border-r-[1.5px] border-slate-950 flex flex-col">
            <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 text-center border-b-[1.5px] border-slate-950">
              검사일
            </div>
            <div className="flex-1 flex items-center justify-center text-[11px] font-mono font-bold text-slate-950 p-1 text-center">
              {inspectionDate}
            </div>
          </div>

          {/* Column 2: 검사자 */}
          <div className="w-[85px] border-r-[1.5px] border-slate-950 flex flex-col">
            <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 text-center border-b-[1.5px] border-slate-950">
              검사자
            </div>
            <div className="flex-1 flex items-center justify-center text-[11px] font-bold text-slate-950 p-1 text-center">
              {inspector.split(' ')[0]}
            </div>
          </div>

          {/* Column 3: 승인 */}
          <div className="w-[85px] border-r-[1.5px] border-slate-950 flex flex-col">
            <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 text-center border-b-[1.5px] border-slate-950">
              승인
            </div>
            <div className="flex-1 flex items-center justify-center text-[11px] font-bold text-slate-950 p-1 text-center">
              {approver.split(' ')[0]}
            </div>
          </div>

          {/* Column 4: 검사결과 / Stamp */}
          <div className="w-[95px] flex flex-col">
            <div className="bg-[#D9F2E6] text-slate-950 text-[11px] font-black py-1 text-center border-b-[1.5px] border-slate-950">
              검사결과
            </div>
            <div className="flex-1 flex items-center justify-center p-1 relative">
              {isPassed ? (
                /* Official Blue Q.C PASS JSTECH Stamp */
                <div className="w-[72px] h-[40px] rounded-[14px] border-[2.5px] border-[#0284c7] flex flex-col items-center justify-center text-[#0284c7] font-black select-none bg-blue-50/20">
                  <div className="text-[10px] tracking-widest leading-none">Q.C</div>
                  <div className="text-[14px] tracking-wider font-extrabold leading-tight">PASS</div>
                  <div className="text-[7.5px] tracking-widest leading-none font-bold">JSTECH</div>
                </div>
              ) : (
                <div className="w-[72px] h-[40px] rounded-[14px] border-[2.5px] border-rose-600 flex flex-col items-center justify-center text-rose-600 font-black">
                  <div className="text-[12px] tracking-widest">FAIL</div>
                  <div className="text-[7.5px] tracking-widest font-bold">JSTECH</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
