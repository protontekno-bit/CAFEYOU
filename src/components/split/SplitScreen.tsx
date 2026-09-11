import React from 'react';
import { OperatorScreen } from '../operator/OperatorScreen';
import { PlayerScreen } from '../player/PlayerScreen';
import { AppRole } from '../../types';

interface SplitScreenProps {
  setRole: (role: AppRole) => void;
}

export const SplitScreen: React.FC<SplitScreenProps> = ({ setRole }) => {
  return (
    <div className="flex flex-col lg:flex-row w-full h-screen overflow-hidden bg-slate-950">
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-700 overflow-y-auto relative">
        <OperatorScreen setRole={setRole} />
      </div>
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full relative bg-black">
        <PlayerScreen />
      </div>
    </div>
  );
};
