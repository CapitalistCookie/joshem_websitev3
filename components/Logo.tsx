import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 500 500" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          {`
            .logo-text { font-family: 'Satisfy', cursive; }
            .logo-subtext { font-family: 'Poppins', sans-serif; }
          `}
        </style>
      </defs>
      {/* Background Circle */}
      <circle cx="250" cy="250" r="230" fill="#36B1E5" stroke="black" strokeWidth="20" />
      
      {/* Utensils Group */}
      <g transform="translate(250, 150)">
         {/* Knife (Left) */}
         <path d="M-60 0 L-60 120 L-50 120 L-50 0 C-50 -60 -70 -60 -70 0 L-70 120 L-60 120" fill="black" />
         
         {/* Fork (Right) */}
         <path d="M50 0 L50 70 L55 70 L55 0 C55 -15 65 -15 65 0 L65 70 L70 70 L70 0 C70 -30 50 -30 50 0" fill="black" />
         <rect x="58" y="70" width="4" height="50" fill="black" />

         {/* Spoon (Center) */}
         <ellipse cx="0" cy="0" rx="25" ry="35" fill="black" />
         <rect x="-4" y="30" width="8" height="90" fill="black" />
         
         {/* Chef Hat */}
         <path d="M-20 -30 Q-30 -50 -10 -60 Q0 -80 10 -60 Q30 -50 20 -30 Z" fill="white" stroke="black" strokeWidth="3" />
      </g>

      {/* Text JoShem */}
      <text 
        x="50%" 
        y="60%" 
        textAnchor="middle" 
        fill="white" 
        stroke="black" 
        strokeWidth="6" 
        fontSize="140" 
        className="logo-text"
        style={{ paintOrder: "stroke fill" }}
      >
        JoShem
      </text>

      {/* Text foods */}
      <text 
        x="50%" 
        y="80%" 
        textAnchor="middle" 
        fill="black" 
        fontSize="60" 
        fontWeight="bold" 
        className="logo-subtext"
        letterSpacing="2"
      >
        foods
      </text>
    </svg>
  );
};

export default Logo;