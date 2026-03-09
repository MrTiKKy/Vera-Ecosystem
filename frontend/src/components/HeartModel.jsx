import React from 'react';
import { useGLTF, Float, Stage, Center } from '@react-three/drei';

const HeartModel = ({ path }) => {
  // Încărcăm modelul dinamic bazat pe selecție
  const { scene } = useGLTF(path);

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      {/* Stage asigură iluminarea automată ca să nu mai vezi negru */}
      <Stage environment="city" intensity={0.5} contactShadow={false} adjustCamera={true}>
        <Center>
          <primitive 
            object={scene} 
            // Scalarea 1 este acum gestionată automat de Stage
            scale={5} 
          />
        </Center>
      </Stage>
    </Float>
  );
};

export default HeartModel;