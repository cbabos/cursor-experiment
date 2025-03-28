import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ollamaApi } from '../api/ollama';
import { useAgent } from '../context/AgentContext';
import { Model } from '../types';

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAgent();
  const { data: models, isLoading, error } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: ollamaApi.listModels,
  });

  if (isLoading) return <div>Loading models...</div>;
  if (error) return <div>Error loading models: {(error as Error).message}</div>;

  return (
    <FormControl fullWidth>
      <InputLabel>Model</InputLabel>
      <Select
        value={selectedModel?.name || ''}
        onChange={(e) => setSelectedModel({ name: e.target.value })}
        label="Model"
      >
        {models?.map((model) => (
          <MenuItem key={model.name} value={model.name}>
            {model.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
} 