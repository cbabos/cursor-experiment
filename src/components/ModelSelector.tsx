import { FormControl, InputLabel, MenuItem, Select, styled } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ollamaApi } from '../api/ollama';
import { useAgent } from '../context/AgentContext';

const RetroFormControl = styled(FormControl)({
  '& .MuiInputLabel-root': {
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '15px',
  },
  '& .MuiSelect-select': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '15px',
    color: '#000000',
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
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '15px',
              color: '#000000',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 122, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 122, 255, 0.3)',
                },
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