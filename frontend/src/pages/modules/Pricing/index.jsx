import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { PermissionCodes } from "../../../constants/permissions";
import { SubTabs } from "../../../components/ui";
import DiscountRulesTab from "./DiscountRulesTab";
import PromotionsTab from "./PromotionsTab";
import QuoteTab from "./QuoteTab";

export default function PricingModule() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PermissionCodes.MANAGE_DISCOUNTS);

  const tabs = [
    { key: "quote", label: "Calculate Quote" },
    { key: "discounts", label: "Discount Rules" },
    { key: "promotions", label: "Promotions" },
  ];
  const [active, setActive] = useState("quote");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pricing & Promotions</h1>
          <p className="page-subtitle">Discount rules, seasonal promotions, and live quote calculation.</p>
        </div>
      </div>

      <SubTabs tabs={tabs} active={active} onChange={setActive} />
      {active === "quote" && <QuoteTab />}
      {active === "discounts" && <DiscountRulesTab canManage={canManage} />}
      {active === "promotions" && <PromotionsTab canManage={canManage} />}
    </div>
  );
}
