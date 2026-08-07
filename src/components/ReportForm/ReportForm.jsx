import React, { useState, useEffect } from "react";
import "./ReportForm.css";
import { 
  ArrowLeft, ShieldCheck, CheckCircle2, Sparkles, AlertCircle, 
  Phone, User, Clock, Gift, Star, Award, Zap, Scissors, Check, Lock, Quote, CreditCard, Globe, ChevronDown
} from "lucide-react";
import vwLogo from "../../assets/VW-HR.png";
import heroAcharyaImg from "../../assets/Elite Presentation (1).webp";
import { trackPixelEvent } from "../../utils/pixel";
import { getUtmParamsForNotes } from "../../utils/utm";

export default function ReportForm({ onBack, onPaymentSuccess }) {
  // Form Inputs: Full Name, WhatsApp Phone Number, & Select Report Language
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    reportLanguage: "Hindi" // Default to Hindi
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing & Coupon States (Default ₹1,199 -> Coupon drops to ₹999)
  const [discountApplied, setDiscountApplied] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(1199);
  const [isRolling, setIsRolling] = useState(false);

  // Live 10-Minute Urgency Countdown Timer
  const [timerSeconds, setTimerSeconds] = useState(599); // 09:59 mins

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 🎉 REALISTIC HTML5 CANVAS PARTY POPPER CONFETTI BURST (Fires ONCE on Click)
  const triggerCanvasConfetti = () => {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ["#f97316", "#eab308", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#f43f5e", "#06b6d4"];
    const count = 160;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.7),
        y: canvas.height * 0.35,
        vx: (Math.random() - 0.5) * 22,
        vy: Math.random() * -20 - 9,
        sizeWidth: Math.random() * 12 + 7,
        sizeHeight: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 16,
        opacity: 1,
        isRibbon: Math.random() > 0.25
      });
    }

    let animationId;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity force
        p.vx *= 0.985; // air drag
        p.rotation += p.rotationSpeed;

        if (elapsed > 1900) {
          p.opacity = Math.max(0, p.opacity - 0.035);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        ctx.fillStyle = p.color;
        if (p.isRibbon) {
          ctx.fillRect(-p.sizeWidth / 2, -p.sizeHeight / 2, p.sizeWidth, p.sizeHeight);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.sizeWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (elapsed < 2900) {
        animationId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationId);
      }
    };

    animate();
  };

  // Interactive Coupon Click Handler (Confetti Explosion + Rolling Price Drop 1199 -> 999)
  const handleApplyCoupon = () => {
    if (discountApplied || isRolling) return;
    setIsRolling(true);

    // Fire HTML5 Canvas Party Popper Burst ONCE
    triggerCanvasConfetti();

    // Fast Rolling Counter Animation (₹1,199 down to ₹999)
    let current = 1199;
    const target = 999;
    const step = 20;
    const interval = setInterval(() => {
      current -= step;
      if (current <= target) {
        current = target;
        clearInterval(interval);
        setIsRolling(false);
        setDiscountApplied(true);
        setDisplayPrice(999);
      } else {
        setDisplayPrice(current);
      }
    }, 35);

    try {
      trackPixelEvent("CouponApplied", { discount: 200, price: 999 });
    } catch (e) {}
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = true;
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const formEl = document.getElementById("checkout-main-form");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Trigger Meta Facebook Pixel InitiateCheckout Event
    trackPixelEvent("InitiateCheckout", { value: displayPrice, currency: "INR" });

    setIsSubmitting(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Razorpay payment gateway failed to load. Please check your internet connection.");
      setIsSubmitting(false);
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_T352jcZMnVxxRV";

    // Create Razorpay Order via Orders API for 100% instant automatic payment capture
    let orderId = "";
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: displayPrice * 100 }) // ₹1,199 or ₹999 in paise
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (orderData?.order_id) {
          orderId = orderData.order_id;
        }
      }
    } catch (err) {
      console.warn("Orders API warning, proceeding with fallback checkout options:", err);
    }

    const uniqueCustomerId = "NEWVW-" + Math.floor(10000000 + Math.random() * 90000000);

    const options = {
      key: keyId,
      amount: displayPrice * 100, // Dynamic amount: ₹1,199 (119900) or ₹999 (99900)
      currency: "INR",
      name: "VastuWheels (Powered & Managed by GlobalInch)",
      description: "Personalised Vastu Science Report",
      order_id: orderId || undefined,
      payment_capture: 1, // Automatic capture
      handler: function (response) {
        console.log("Razorpay Payment Success Response:", response);
        setIsSubmitting(false);
        if (onPaymentSuccess) {
          onPaymentSuccess({
            language: formData.reportLanguage, // Passes Hindi or English
            fullName: formData.fullName,
            phone: formData.phone,
            email: "",
            uniqueCustomerId: uniqueCustomerId,
            paymentId: response?.razorpay_payment_id || ("PAY_" + Math.random().toString(36).substring(2, 10).toUpperCase())
          });
        }
      },
      prefill: {
        name: formData.fullName,
        contact: formData.phone
      },
      notes: {
        payment_type: "new_vastu_form_checkout",
        unique_customer_id: uniqueCustomerId,
        full_name: formData.fullName,
        phone_number: formData.phone,
        original_price: "₹1,199",
        paid_price: `₹${displayPrice}`,
        coupon_applied: discountApplied ? "VASTU200" : "NONE",
        report_language: formData.reportLanguage === "Hindi" ? "Vastu Wheels Hindi fb" : "Vastu Wheels English FB",
        ...getUtmParamsForNotes()
      },
      theme: {
        color: "#ea580c"
      },
      modal: {
        ondismiss: function () {
          setIsSubmitting(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay Error:", err);
      setIsSubmitting(false);
      if (onPaymentSuccess) {
        onPaymentSuccess({
          language: formData.reportLanguage,
          fullName: formData.fullName,
          phone: formData.phone
        });
      }
    }
  };

  return (
    <div className="report-form-page min-h-screen bg-gradient-to-b from-[#fffbf7] via-[#fff7ee] to-[#fffbf7] py-3 sm:py-6 px-4 sm:px-8 md:px-12 xl:px-16 text-slate-900 font-sora relative overflow-hidden">
      
      {/* Background Subtle Radial Warm Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-orange-300/20 via-amber-300/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* HTML5 Canvas for Realistic Party Popper 🎉 Confetti Burst */}
      <canvas id="confetti-canvas" />

      {/* Top Header Navigation Bar (Logo placed on Left next to Back button) */}
      <div className="max-w-[1400px] mx-auto flex items-center justify-between border-b border-orange-200/90 pb-2.5 sm:pb-4 mb-3 sm:mb-6 relative z-10">
        
        {/* Left Side: Back Button + VastuWheels Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-xs sm:text-base font-extrabold text-slate-700 hover:text-[#ea580c] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="shrink-0" />
            <span>Back</span>
          </button>
          
          <div className="h-5 w-px bg-orange-300/80" />

          <img 
            src={vwLogo} 
            alt="Vastu Wheels Logo" 
            onClick={onBack}
            className="h-8 sm:h-10 md:h-12 w-auto object-contain cursor-pointer transition-transform hover:scale-105"
          />
        </div>

        {/* Right Side: Checkout Badge */}
        <span className="bg-orange-100/90 text-[#ea580c] text-[11px] sm:text-sm font-black px-3 sm:px-4 py-1 rounded-full border border-orange-300 shadow-sm">
          Checkout
        </span>
      </div>

      {/* Main Container Grid */}
      <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-6 relative z-10" id="checkout-main-form">
        
        {/* Top Urgency Banner with Live Countdown Timer */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-row items-center justify-between gap-2 text-left border border-orange-300/60">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm md:text-base font-black leading-tight">
            <Zap size={18} className="text-amber-200 animate-bounce shrink-0" />
            <span>SPECIAL OFFER RESERVED FOR YOU</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-black border border-white/40 shrink-0">
            <Clock size={16} className="text-amber-100 shrink-0" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
        </div>

        {/* 2-Column Desktop Full-Width Grid (order-1 on mobile = Form top, order-2 on mobile = Acharya Ji) */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 lg:gap-10 items-start">
          
          {/* FORM CARD & COUPON CARD (order-1 on mobile = DIRECTLY AT TOP ABOVE THE FOLD!) */}
          <div className="order-1 lg:order-2 lg:col-span-7 w-full space-y-3 sm:space-y-6">
            
            {/* Header & Subheader */}
            <div className="text-left space-y-0.5">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-sora tracking-tight">
                Get Your Personalized <span className="text-[#ea580c]">Vastu Report</span>
              </h1>
              <p className="text-xs sm:text-base text-slate-600 font-semibold">
                Enter your Name, WhatsApp number & select language to claim your report
              </p>
            </div>

            {/* Validation Error Alert */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-rose-50 border-2 border-rose-400 p-3 rounded-2xl flex items-center gap-2 text-rose-700 text-xs sm:text-sm font-bold shadow-md animate-pop-in">
                <AlertCircle size={18} className="shrink-0 text-rose-600" />
                <span>Please enter your Name & valid 10-digit WhatsApp number below.</span>
              </div>
            )}

            {/* 🎁 INTERACTIVE VIP DISCOUNT COUPON CARD (1199 -> 999) */}
            <div 
              onClick={handleApplyCoupon}
              className={`p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden cursor-pointer coupon-ticket-notch ${
                discountApplied 
                  ? "bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-emerald-500 shadow-lg"
                  : "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-orange-400 shadow-md hover:shadow-xl hover:scale-[1.01] animate-pulse-glow"
              }`}
            >
              <div className="flex items-center justify-between gap-2 relative z-10">
                
                {/* Left Offer Text */}
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <Gift size={20} className={discountApplied ? "text-emerald-600 shrink-0" : "text-[#ea580c] animate-bounce shrink-0"} />
                    <span className={`text-xs sm:text-sm font-black uppercase tracking-wide ${discountApplied ? "text-emerald-700" : "text-[#ea580c]"}`}>
                      {discountApplied ? "🎉 COUPON APPLIED: VASTU200" : "🎁 UNLOCK ₹200 INSTANT DISCOUNT"}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-tight">
                    {discountApplied 
                      ? "Congratulations! You unlocked the lowest price guaranteed." 
                      : "Tap here to scratch & apply ₹200 OFF coupon!"}
                  </p>
                </div>

                {/* Right Price Display with Scratched Line Animation */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2 justify-end">
                    
                    {/* Scratched Original Price ₹1,199 */}
                    {discountApplied ? (
                      <span className="scratched-price text-xs sm:text-base">
                        ₹1,199
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-400 font-bold line-through">
                        ₹2,499
                      </span>
                    )}

                    {/* Active Discount Price */}
                    <div className="flex items-baseline gap-0.5 text-xl sm:text-3xl font-black font-sora">
                      <span className="text-xs sm:text-sm font-bold text-slate-700">₹</span>
                      <span className={`transition-all duration-150 ${isRolling ? "scale-125 text-emerald-600" : (discountApplied ? "text-emerald-600" : "text-[#ea580c]")}`}>
                        {displayPrice}
                      </span>
                    </div>

                  </div>

                  {/* Action Tag Button */}
                  <div className="mt-1">
                    {discountApplied ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                        <Check size={13} /> SAVED ₹200
                      </span>
                    ) : (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleApplyCoupon(); }}
                        className="inline-flex items-center gap-1 bg-[#ea580c] hover:bg-orange-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md transition-all cursor-pointer"
                      >
                        <Scissors size={12} /> TAP FOR ₹200 OFF
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </div>

            {/* MAIN FORM: 3 FIELDS (Full Name, WhatsApp Phone Number, & Select Report Language) */}
            <form onSubmit={handleSubmit} noValidate className="bg-white/95 backdrop-blur-md p-5 sm:p-8 rounded-3xl border-2 border-orange-300/90 shadow-xl space-y-4 sm:space-y-6">
              
              {/* Form Bullet Feature Checklist */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm font-extrabold text-slate-800 bg-orange-50/80 p-3 rounded-2xl border border-orange-200">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                  <Zap size={15} className="text-[#ea580c] shrink-0" />
                  <span>48-Hr Delivery</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 border-x border-orange-200 px-1">
                  <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                  <span>No Demolition</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                  <Lock size={15} className="text-amber-600 shrink-0" />
                  <span>Confidential</span>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                
                {/* Field 1: Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-800 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={16} className="text-[#ea580c]" />
                    <span>Full Name *</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 transition-all checkout-input-group bg-slate-50">
                    <input 
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) setErrors({ ...errors, fullName: false });
                      }}
                      className={`w-full bg-transparent px-4 py-3.5 sm:py-4 text-base text-slate-900 font-semibold focus:outline-none ${
                        errors.fullName ? "border-2 border-rose-500 rounded-xl bg-rose-50/50" : ""
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> Please enter your Full Name
                    </p>
                  )}
                </div>

                {/* Field 2: WhatsApp Phone Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-800 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone size={16} className="text-[#ea580c]" />
                    <span>WhatsApp Phone Number *</span>
                  </label>
                  <div className="flex rounded-xl border border-slate-300 transition-all checkout-input-group bg-slate-50 overflow-hidden">
                    <span className="bg-slate-100 border-r border-slate-300 px-4 py-3.5 sm:py-4 text-sm sm:text-base text-slate-900 font-extrabold flex items-center justify-center shrink-0">
                      🇮🇳 +91
                    </span>
                    <input 
                      type="tel"
                      maxLength={10}
                      placeholder="9999999999"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") });
                        if (errors.phone) setErrors({ ...errors, phone: false });
                      }}
                      className={`w-full bg-transparent px-4 py-3.5 sm:py-4 text-base text-slate-900 font-semibold focus:outline-none ${
                        errors.phone ? "border-2 border-rose-500 rounded-r-xl bg-rose-50/50" : ""
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> Valid 10-digit WhatsApp number required
                    </p>
                  )}
                </div>

                {/* Field 3: Select Report Language (Clean options without flags) */}
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-800 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Globe size={16} className="text-[#ea580c]" />
                    <span>Select Report Language *</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 transition-all checkout-input-group bg-slate-50 overflow-hidden w-full max-w-full box-border">
                    <select
                      value={formData.reportLanguage}
                      onChange={(e) => setFormData({ ...formData, reportLanguage: e.target.value })}
                      className="w-full bg-transparent px-4 py-3.5 sm:py-4 text-sm sm:text-base text-slate-900 font-extrabold focus:outline-none cursor-pointer appearance-none pr-10 truncate"
                    >
                      <option value="Hindi">Hindi (हिंदी रिपोर्ट)</option>
                      <option value="English">English (English Report)</option>
                    </select>
                    
                    {/* Custom Dropdown Chevron Icon */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Luxury Submit CTA Button */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-orange-primary btn-shimmer-wrap text-base sm:text-xl py-4 sm:py-5 flex items-center justify-center gap-2.5 cursor-pointer shadow-xl font-black rounded-2xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <span>Opening Payment Gateway...</span>
                  ) : (
                    <>
                      <Sparkles size={20} className="text-amber-200 animate-pulse shrink-0" />
                      <span>Proceed to Pay ₹{displayPrice} & Get Report</span>
                    </>
                  )}
                </button>

                <div className="text-center text-xs sm:text-sm font-extrabold text-emerald-700">
                  🎉 Special Deal: You Save ₹{2499 - displayPrice} Today!
                </div>
              </div>

              {/* Security & Payment Badges */}
              <div className="flex flex-col items-center justify-center text-xs text-slate-600 font-semibold pt-1 text-center space-y-2">
                
                {/* Razorpay & GlobalInch Assurance Badge */}
                <span className="text-[#ea580c] font-black flex items-center justify-center gap-1.5 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200 shadow-sm text-xs sm:text-sm">
                  <ShieldCheck size={16} className="text-[#ea580c]" />
                  <span>Powered & Managed by GlobalInch | Secured by Razorpay</span>
                </span>

                {/* Payment Method Pills - SINGLE ROW ON MOBILE! */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 pt-1 flex-nowrap whitespace-nowrap text-[10px] sm:text-xs text-slate-600 font-extrabold w-full overflow-hidden">
                  <span className="bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-slate-200 flex items-center gap-1 shrink-0">
                    <CreditCard size={11} className="text-slate-600 shrink-0" /> UPI / Cards / NetBanking
                  </span>
                  <span className="bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-slate-200 flex items-center gap-1 shrink-0">
                    <Lock size={11} className="text-emerald-600 shrink-0" /> 256-Bit SSL Encrypted
                  </span>
                </div>

              </div>

            </form>

          </div>

          {/* ACHARYA JI PORTRAIT & TRUST CARD (Full-Size Hero Presentation Graphics) */}
          <div className="order-2 lg:order-1 lg:col-span-5 w-full space-y-3 sm:space-y-4">
            
            {/* Desktop View Full Card */}
            <div className="hidden lg:block bg-white/95 backdrop-blur-md p-5 rounded-3xl border-2 border-orange-200/90 shadow-xl space-y-4 text-center relative overflow-hidden">
              
              {/* Full-Size Unclipped Hero Presentation Image */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-orange-100/60 via-amber-50 to-white border-2 border-orange-200 shadow-md group">
                <img 
                  src={heroAcharyaImg} 
                  alt="Acharya Ji - Vastu Scholar Hero Graphics" 
                  className="w-full h-auto object-contain block transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

              {/* Floating Verified Badge */}
              <div className="bg-orange-50/90 border border-orange-200 p-3 rounded-2xl flex items-center justify-between text-left shadow-sm">
                <div>
                  <div className="text-sm sm:text-base font-black text-slate-900 font-sora flex items-center gap-1">
                    <span>Acharya Pankaj Ji</span>
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-xs text-[#ea580c] font-bold">15+ Yrs Vedic Vastu Scholar</div>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                  <Star size={13} className="fill-amber-500 text-amber-500" />
                  <span>4.7 ★</span>
                </div>
              </div>

              {/* Acharya Ji Personal Assurance Quote */}
              <div className="bg-orange-50/90 border border-orange-200 p-3.5 rounded-2xl text-left space-y-1 relative">
                <Quote size={20} className="text-orange-400 opacity-60 absolute top-2 right-2" />
                <p className="text-xs sm:text-sm text-slate-700 font-semibold italic leading-relaxed">
                  "Aapke ghar ki energy ko bina kisi tod-phod ke 16 directional zones se balance kiya jayega."
                </p>
                <div className="text-xs font-extrabold text-[#ea580c]">— Acharya Pankaj Ji</div>
              </div>

              {/* High-Trust Pillars */}
              <div className="space-y-2.5 text-left text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-3 bg-orange-50/70 p-3 rounded-xl border border-orange-200/70 hover:bg-orange-50 transition-colors">
                  <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                  <span>100% Non-Demolition Remedies (Zero Wall Breaking)</span>
                </div>
                <div className="flex items-center gap-3 bg-orange-50/70 p-3 rounded-xl border border-orange-200/70 hover:bg-orange-50 transition-colors">
                  <Award size={20} className="text-[#ea580c] shrink-0" />
                  <span>ISO 9001:2015 Certified Energy Calculations</span>
                </div>
                <div className="flex items-center gap-3 bg-orange-50/70 p-3 rounded-xl border border-orange-200/70 hover:bg-orange-50 transition-colors">
                  <Zap size={20} className="text-amber-600 shrink-0" />
                  <span>Report Delivered Directly on WhatsApp in 48 Hours</span>
                </div>
              </div>

              {/* Social Proof Stats */}
              <div className="pt-2.5 border-t border-orange-100 flex items-center justify-around text-center text-xs sm:text-sm">
                <div>
                  <div className="font-extrabold text-[#ea580c] text-lg font-sora">60,000+</div>
                  <div className="text-xs text-slate-500 font-bold">Happy Consultations</div>
                </div>
                <div className="h-8 w-px bg-orange-200" />
                <div>
                  <div className="font-extrabold text-[#ea580c] text-lg font-sora">16-Zone</div>
                  <div className="text-xs text-slate-500 font-bold">Scientific Mapping</div>
                </div>
              </div>

            </div>

            {/* Mobile View Sleek Card (Full Unclipped Hero Graphics) */}
            <div className="lg:hidden bg-white/95 backdrop-blur-md p-4 rounded-2xl border-2 border-orange-300/90 shadow-md space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-28 sm:w-36 rounded-xl overflow-hidden bg-gradient-to-b from-orange-100 to-amber-50 border border-orange-200 shrink-0 relative shadow-sm">
                  <img 
                    src={heroAcharyaImg} 
                    alt="Acharya Ji" 
                    className="w-full h-auto object-contain block"
                  />
                </div>

                <div className="space-y-1.5 text-left flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-slate-900 font-sora flex items-center gap-1">
                      <span>Acharya Pankaj Ji</span>
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    </div>
                    <span className="bg-amber-100 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full border border-amber-300">
                      4.7 ★
                    </span>
                  </div>
                  <p className="text-xs text-[#ea580c] font-bold">15+ Yrs Vedic Vastu Scholar</p>

                  <div className="pt-1 flex flex-col gap-1 text-xs text-slate-700 font-extrabold">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>100% Zero-Demolition Remedies</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-800">
                      <Award size={14} className="text-[#ea580c]" />
                      <span>60,000+ Consultations</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quote on Mobile */}
              <div className="bg-orange-50/90 border border-orange-200 p-2.5 rounded-xl text-xs text-slate-700 font-semibold italic">
                "Aapke ghar ki energy ko bina kisi tod-phod ke 16 directional zones se balance kiya jayega." — <span className="font-extrabold text-[#ea580c] not-italic">Acharya Pankaj Ji</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
