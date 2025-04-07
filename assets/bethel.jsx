
import Svg, { 
    Circle, 
    Rect, 
    Path, 
    LinearGradient as SvgLinearGradient, 
    Stop, 
    Ellipse, 
    G 
  } from 'react-native-svg';
// City SVG Component
export const CityIllustration = (props) => {
    return (
      <Svg viewBox="0 0 800 400" {...props}>
        {/* Sky Background */}
        <Rect width="800" height="400" fill="#E0F7FA" />
        
        {/* Sun */}
        <Circle cx="650" cy="80" r="40" fill="#FFD700" />
        <Circle cx="650" cy="80" r="60" fill="#FFD700" opacity="0.3" />
        
        {/* Clouds */}
        <G fill="#FFFFFF" opacity="0.8">
          <Ellipse cx="150" cy="70" rx="50" ry="30" />
          <Ellipse cx="180" cy="70" rx="40" ry="25" />
          <Ellipse cx="120" cy="70" rx="30" ry="20" />
          
          <Ellipse cx="550" cy="120" rx="60" ry="30" />
          <Ellipse cx="580" cy="120" rx="50" ry="25" />
          <Ellipse cx="520" cy="120" rx="40" ry="20" />
        </G>
        
        {/* City Buildings */}
        {/* Tall Building 1 - Modern Glass Tower */}
        <Rect x="100" y="150" width="80" height="250" fill="#1D4ED8" />
        <G fill="#FFFFFF" opacity="0.3">
          <Rect x="110" y="160" width="15" height="20" />
          <Rect x="130" y="160" width="15" height="20" />
          <Rect x="150" y="160" width="15" height="20" />
          
          <Rect x="110" y="190" width="15" height="20" />
          <Rect x="130" y="190" width="15" height="20" />
          <Rect x="150" y="190" width="15" height="20" />
          
          <Rect x="110" y="220" width="15" height="20" />
          <Rect x="130" y="220" width="15" height="20" />
          <Rect x="150" y="220" width="15" height="20" />
          
          <Rect x="110" y="250" width="15" height="20" />
          <Rect x="130" y="250" width="15" height="20" />
          <Rect x="150" y="250" width="15" height="20" />
          
          <Rect x="110" y="280" width="15" height="20" />
          <Rect x="130" y="280" width="15" height="20" />
          <Rect x="150" y="280" width="15" height="20" />
        </G>
        
        {/* Tall Building 2 - Office Building */}
        <Rect x="200" y="200" width="100" height="200" fill="#FF8008" />
        <G fill="#FFFFFF" opacity="0.3">
          <Rect x="210" y="210" width="20" height="15" />
          <Rect x="240" y="210" width="20" height="15" />
          <Rect x="270" y="210" width="20" height="15" />
          
          <Rect x="210" y="235" width="20" height="15" />
          <Rect x="240" y="235" width="20" height="15" />
          <Rect x="270" y="235" width="20" height="15" />
          
          <Rect x="210" y="260" width="20" height="15" />
          <Rect x="240" y="260" width="20" height="15" />
          <Rect x="270" y="260" width="20" height="15" />
          
          <Rect x="210" y="285" width="20" height="15" />
          <Rect x="240" y="285" width="20" height="15" />
          <Rect x="270" y="285" width="20" height="15" />
          
          <Rect x="210" y="310" width="20" height="15" />
          <Rect x="240" y="310" width="20" height="15" />
          <Rect x="270" y="310" width="20" height="15" />
        </G>
        
        {/* Modern Building with antenna */}
        <Rect x="320" y="170" width="70" height="230" fill="#0284C7" />
        <Rect x="350" y="140" width="10" height="30" fill="#666666" />
        <G fill="#FFFFFF" opacity="0.3">
          <Rect x="330" y="180" width="15" height="10" />
          <Rect x="355" y="180" width="15" height="10" />
          
          <Rect x="330" y="200" width="15" height="10" />
          <Rect x="355" y="200" width="15" height="10" />
          
          <Rect x="330" y="220" width="15" height="10" />
          <Rect x="355" y="220" width="15" height="10" />
          
          <Rect x="330" y="240" width="15" height="10" />
          <Rect x="355" y="240" width="15" height="10" />
          
          <Rect x="330" y="260" width="15" height="10" />
          <Rect x="355" y="260" width="15" height="10" />
        </G>
        
        {/* Medium Buildings */}
        <Rect x="400" y="180" width="70" height="220" fill="#1D4ED8" />
        <G fill="#FFFFFF" opacity="0.3">
          <Rect x="410" y="190" width="15" height="10" />
          <Rect x="435" y="190" width="15" height="10" />
          
          <Rect x="410" y="210" width="15" height="10" />
          <Rect x="435" y="210" width="15" height="10" />
          
          <Rect x="410" y="230" width="15" height="10" />
          <Rect x="435" y="230" width="15" height="10" />
          
          <Rect x="410" y="250" width="15" height="10" />
          <Rect x="435" y="250" width="15" height="10" />
          
          <Rect x="410" y="270" width="15" height="10" />
          <Rect x="435" y="270" width="15" height="10" />
        </G>
        
        {/* Office Building */}
        <Rect x="490" y="220" width="80" height="180" fill="#FF8008" />
        <G fill="#FFFFFF" opacity="0.3">
          <Rect x="500" y="230" width="15" height="10" />
          <Rect x="525" y="230" width="15" height="10" />
          <Rect x="550" y="230" width="15" height="10" />
          
          <Rect x="500" y="250" width="15" height="10" />
          <Rect x="525" y="250" width="15" height="10" />
          <Rect x="550" y="250" width="15" height="10" />
          
          <Rect x="500" y="270" width="15" height="10" />
          <Rect x="525" y="270" width="15" height="10" />
          <Rect x="550" y="270" width="15" height="10" />
        </G>
        
        {/* Small Buildings in Front */}
        <Rect x="590" y="250" width="50" height="150" fill="#1D4ED8" />
        <G fill="#FFFFFF" opacity="0.3">
          <Rect x="600" y="260" width="10" height="8" />
          <Rect x="620" y="260" width="10" height="8" />
          
          <Rect x="600" y="278" width="10" height="8" />
          <Rect x="620" y="278" width="10" height="8" />
          
          <Rect x="600" y="296" width="10" height="8" />
          <Rect x="620" y="296" width="10" height="8" />
        </G>
        
        {/* Building with dome */}
        <Rect x="660" y="230" width="60" height="170" fill="#FF8008" />
        <Circle cx="690" cy="230" r="25" fill="#0284C7" />
        
        {/* Trees */}
        <Rect x="40" y="350" width="5" height="15" fill="#8B4513" />
        <Circle cx="42.5" cy="335" r="15" fill="#228B22" />
        
        <Rect x="70" y="355" width="5" height="15" fill="#8B4513" />
        <Circle cx="72.5" cy="340" r="15" fill="#228B22" />
        
        <Rect x="740" y="370" width="5" height="15" fill="#8B4513" />
        <Circle cx="742.5" cy="355" r="15" fill="#228B22" />
        
        {/* Ground */}
        <Rect x="0" y="385" width="800" height="15" fill="#666666" />
      </Svg>
    );
  }