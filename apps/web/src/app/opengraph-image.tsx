import { ImageResponse } from "next/og";

export const alt = "IFFE Bbenhe Development SACCO - Empowering Financial Freedom";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 80px",
        background: "linear-gradient(135deg, #003311 0%, #004d1a 45%, #006622 75%, #0a2912 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "680px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            padding: "6px 18px",
            borderRadius: "9999px",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#f1c40f",
            marginBottom: "20px",
          }}
        >
          Jinja City, Uganda - Obwegaisi Mu Kwisanhia
        </div>
        <div
          style={{
            fontSize: "52px",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "14px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#ffffff", marginRight: "12px" }}>IFFE</span>
          <span style={{ color: "#f1c40f", marginRight: "12px" }}>Bbenhe</span>
          <span style={{ color: "#ffffff" }}>SACCO</span>
        </div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: "#a7f3d0",
            marginBottom: "20px",
            fontStyle: "italic",
          }}
        >
          Empowering Financial Freedom
        </div>
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.5,
            color: "#e2e8f0",
            marginBottom: "30px",
          }}
        >
          A modern savings and credit cooperative organization. Secure savings, affordable loans, and community-driven
          prosperity.
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Secure Savings
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Affordable Loans
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
            }}
          >
            Social Welfare
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45), 0 0 0 12px rgba(241, 196, 15, 0.4)",
        }}
      >
        { }
        <img
          src="https://iffe-sacco.vercel.app/logo.png"
          alt="IFFE Logo"
          width={240}
          height={240}
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>,
    {
      ...size,
    },
  );
}
