import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { HomePage } from './pages/HomePage/HomePage';
import { StagePage } from './pages/StagePage/StagePage';
import { IdeaFullPage } from './pages/IdeaFullPage/IdeaFullPage';
import { MethodsFullPage } from './pages/MethodsFullPage/MethodsFullPage';
import { AnalysisFullPage } from './pages/AnalysisFullPage/AnalysisFullPage';
import { PaperFullPage } from './pages/PaperFullPage/PaperFullPage';
import { LiteratureFullPage } from './pages/LiteratureFullPage/LiteratureFullPage';
import { RefereeFullPage } from './pages/RefereeFullPage/RefereeFullPage';
import { KeywordsFullPage } from './pages/KeywordsFullPage/KeywordsFullPage';

function StageFullPageDispatch() {
  const { stageId } = useParams<{ stageId: string }>();
  if (stageId === 'methods')    return <MethodsFullPage />;
  if (stageId === 'analysis')   return <AnalysisFullPage />;
  if (stageId === 'paper')      return <PaperFullPage />;
  if (stageId === 'literature') return <LiteratureFullPage />;
  if (stageId === 'referee')    return <RefereeFullPage />;
  if (stageId === 'keywords')   return <KeywordsFullPage />;
  return <IdeaFullPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/project/:projectId/stage/:stageId/full" element={<StageFullPageDispatch />} />
      <Route path="/project/:projectId/stage/:stageId" element={<StagePage />} />
      {/* Convenience redirect: /project/:id → stage 1 */}
      <Route path="/project/:projectId" element={<Navigate to="stage/input" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
