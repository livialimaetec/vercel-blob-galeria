const express = require('express');
const { put, list, del } = require('@vercel/blob');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Rota para upload
app.post('/api/upload', async (req, res) => {
  const filename = req.headers['x-vercel-filename'];

  if (!filename) {
    return res.status(400).json({ message: 'O nome do arquivo é obrigatório no cabeçalho x-vercel-filename.' });
  }

  try {
    const blob = await put(filename, req, {
      access: 'public',
    });
    res.status(200).json(blob);
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do arquivo.', error: error.message });
  }
});

// Rota para listar arquivos
app.get('/api/files', async (req, res) => {
  try {
    const { blobs } = await list();
    res.status(200).json(blobs);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ message: 'Erro ao buscar a lista de arquivos.', error: error.message });
  }
});

// Rota para deletar
app.delete('/api/delete/:url', async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    await del(url);
    res.json({ success: true, message: 'Imagem deletada com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar imagem.', error: error.message });
  }
});

// Rota para atualizar
app.put('/api/update/:url', async (req, res) => {
  try {
    const oldUrl = decodeURIComponent(req.params.url);
    const { newFileUrl, filename } = req.body;

    // Primeiro deleta a imagem antiga
    await del(oldUrl);
    
    // Faz download da nova imagem
    const response = await fetch(newFileUrl);
    const blob = await response.blob();
    
    // Faz upload da nova imagem
    const newBlob = await put(filename || `updated-${Date.now()}`, blob, {
      access: 'public',
    });
    
    res.json({ 
      success: true, 
      message: 'Imagem atualizada com sucesso!',
      url: newBlob.url
    });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar imagem.', error: error.message });
  }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});