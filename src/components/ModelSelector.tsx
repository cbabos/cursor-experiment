import { FormControl, InputLabel, MenuItem, Select, styled } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ollamaApi } from '../api/ollama';
import { useAgent } from '../context/AgentContext';

const RetroFormControl = styled(FormControl)({
  '& .MuiInputLabel-root': {
    color: '#00ff00',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '12px',
  },
  '& .MuiSelect-select': {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '14px',
    color: '#00ff00',
  },
});

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAgent();
  const { data: models, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: ollamaApi.listModels,
  });

  if (isLoading) return <div>Loading models...</div>;

  return (
    <RetroFormControl fullWidth>
      <InputLabel id="model-select-label">Select Model</InputLabel>
      <Select
        labelId="model-select-label"
        id="model-select"
        value={selectedModel?.name || ''}
        onChange={(e) => setSelectedModel({ name: e.target.value })}
        label="Select Model"
      >
        {models?.map((model) => (
          <MenuItem
            key={model.name}
            value={model.name}
            sx={{
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              fontSize: '14px',
              color: '#00ff00',
              backgroundColor: '#001100',
              '&:hover': {
                backgroundColor: '#003300',
              },
            }}
          >
            {model.name}
          </MenuItem>
        ))}
      </Select>
    </RetroFormControl>
  );
} 