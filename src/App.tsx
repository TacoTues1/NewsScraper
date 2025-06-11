import React, { useState} from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Grid,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import ArticleView from './components/ArticleView';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions' 
  : 'http://localhost:5000/api';

interface NewsItem {
  title: string;
  author: string;
  date: string;
  source: string;
  url: string;
  imageUrl: string | null;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  request?: any;
  message: string;
}
//alfonz perez Web Dev 2 Section C
// Define the theme colors
const theme = {
  background: '#ffffff', // Pure white background
  surface: '#ffffff', // White surface
  surfaceHover: '#f8f9fa', // Very light gray for hover
  primary: '#2563eb', // Modern blue
  text: {
    primary: '#1f2937', // Dark gray for primary text
    secondary: '#6b7280', // Medium gray for secondary text
    disabled: '#9ca3af' // Light gray for disabled text
  },
  divider: '#e5e7eb', // Light gray for dividers
  scrollbar: {
    track: 'transparent',
    thumb: '#d1d5db', // Light gray for scrollbar
    thumbHover: '#9ca3af' // Darker gray for scrollbar hover
  }
};

function App() {
  const [url, setUrl] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [error, setError] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<{
    title: string;
    author: string;
    date: string;
    content: string;
    imageUrl: string | null;
    source: string;
  } | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [openEthicsModal, setOpenEthicsModal] = useState(false);

  const newsUrls = [
    {
      name: 'ABS-CBN News',
      url: 'https://news.abs-cbn.com/',
      description: 'Philippine news and current events'
    },
    {
      name: 'GMA News',
      url: 'https://www.gmanetwork.com/news/',
      description: 'Latest Philippine news'
    },
    {
      name: 'Rappler',
      url: 'https://www.rappler.com/',
      description: 'Philippine news and analysis'
    },
    {
      name: 'Inquirer',
      url: 'https://newsinfo.inquirer.net/',
      description: 'Philippine daily news'
    },
    {
      name: 'Manila Bulletin',
      url: 'https://mb.com.ph/',
      description: 'Philippine news and information'
    },
    {
      name: 'CNN Philippines',
      url: 'https://www.cnnphilippines.com/',
      description: 'Latest news and updates'
    }
  ];

  const scrapeNews = async () => {
    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    setLoading(true);
    setError('');
    setNews([]);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/scrape`);
      const response = await axios.post(`${API_BASE_URL}/scrape`, { url });
      console.log('Received response:', response.data);
      
      if (response.data.news && response.data.news.length > 0) {
        setNews(response.data.news);
      } else {
        setError('No news articles found. The website might use a different structure or dynamic loading.');
      }
    } catch (error) {
      console.error('Error scraping news:', error);
      const apiError = error as ApiError;
      
      if (apiError.response) {
        console.error('Error response:', apiError.response.data);
        setError(apiError.response.data?.error || 'Failed to scrape news. Please try a different URL.');
      } else if (apiError.request) {
        setError('No response from server. Please make sure the server is running.');
      } else {
        setError('Error: ' + apiError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (url: string) => {
    setSelectedArticle(null);
    setArticleLoading(true);
    setArticleError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/scrape-article`, { url });
      setSelectedArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
      const apiError = error as ApiError;
      setArticleError(
        apiError.response?.data?.error || 
        'Failed to fetch article content. Please try again.'
      );
    } finally {
      setArticleLoading(false);
    }
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    setArticleError(null);
  };

  const handleOpenEthicsModal = () => setOpenEthicsModal(true);
  const handleCloseEthicsModal = () => setOpenEthicsModal(false);

  const ethicsContent = {
    title: "Web Scraping Ethics & Legal Considerations",
    sections: [
      {
        title: "When is scraping allowed?",
        content: "Web scraping is generally allowed when:",
        list: [
          "The website's Terms of Service explicitly permit it",
          "The data being scraped is publicly available",
          "You're not bypassing any authentication mechanisms",
          "You're not causing harm to the website's servers",
          "You're respecting rate limits and not overloading the server"
        ]
      },
      {
        title: "Respecting robots.txt Rules",
        content: "To respect a website's robots.txt rules:",
        list: [
          "Always check the robots.txt file before scraping",
          "Respect the \"Disallow\" directives",
          "Follow the specified crawl-delay",
          "Use proper user-agent identification",
          "Implement rate limiting based on the site's requirements"
        ]
      },
      {
        title: "Legal Alternatives for News Data",
        content: "Consider these legal methods for obtaining news data:",
        list: [
          "Official news APIs (e.g., NewsAPI, GDELT Project)",
          "RSS feeds provided by news websites",
          "News aggregation services with proper licensing",
          "Direct partnerships with news organizations",
          "Open data initiatives and public datasets"
        ]
      }
    ]
  };

  const filteredAndSortedNews = news
    .filter(item => 
      filterKeyword === '' || 
      item.title.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      item.author.toLowerCase().includes(filterKeyword.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <Box sx={{
      bgcolor: theme.background,
      minHeight: '100vh',
      color: theme.text.primary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      py: { xs: 2, sm: 4 }
    }}>
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <Paper 
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: theme.background,
            border: '1px solid',
            borderColor: theme.divider,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 1
          }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '1.2rem', sm: '1.4rem' },
                color: theme.text.primary
              }}
            >
              News Scraper
            </Typography>
            <IconButton 
              aria-label="Ethics Consideration" 
              onClick={handleOpenEthicsModal}
              sx={{ 
                color: theme.text.secondary,
                padding: '4px',
                '&:hover': { color: theme.primary },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.2rem'
                }
              }} 
            >
              <InfoIcon />
            </IconButton>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <TextField
              sx={{
                flexGrow: 1,
                '& .MuiInputBase-root': {
                  bgcolor: theme.background,
                  '&:hover': {
                    bgcolor: theme.surfaceHover,
                  },
                  '&.Mui-focused': {
                    boxShadow: 'none',
                    borderColor: theme.primary
                  }
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.divider,
                }
              }}
              label="Enter Website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://news.abs-cbn.com/"
              disabled={loading}
              size="small"
            />
            <Button
              variant="contained"
              onClick={scrapeNews}
              disabled={loading || !url}
              sx={{ 
                bgcolor: theme.primary,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.primary,
                  opacity: 0.9
                },
                minWidth: { xs: '100%', sm: '120px' },
                height: '40px'
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Scrape News'}
            </Button>
            <FormControl sx={{
              minWidth: { xs: '100%', sm: '200px' },
              '& .MuiInputBase-root': {
                bgcolor: theme.background,
                '&:hover': {
                  bgcolor: theme.surfaceHover,
                }
              }
            }} size="small">
              <InputLabel>Quick URLs</InputLabel>
              <Select
                value={url}
                label="Quick URLs"
                onChange={(e) => setUrl(e.target.value as string)}
                displayEmpty
              >
                <MenuItem value=""></MenuItem>
                {newsUrls.map((item, index) => (
                  <MenuItem key={index} value={item.url}>{item.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <TextField 
              label="Filter by keyword" 
              value={filterKeyword} 
              onChange={(e) => setFilterKeyword(e.target.value)} 
              placeholder="e.g., technology, politics" 
              disabled={news.length === 0}
              size="small"
              sx={{ 
                flexGrow: 1,
                '& .MuiInputBase-root': { 
                  bgcolor: theme.background,
                  '&:hover': { bgcolor: theme.surfaceHover }
                }
              }} 
            />
            <FormControl 
              disabled={news.length === 0} 
              sx={{ minWidth: { xs: '100%', sm: '150px' } }}
              size="small"
            >
              <InputLabel>Sort by</InputLabel>
              <Select 
                value={sortBy} 
                label="Sort by" 
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title')} 
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <Box sx={{ 
          flexGrow: 1,
          minWidth: 0,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.scrollbar.track,
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.scrollbar.thumb,
            borderRadius: '3px',
            '&:hover': {
              background: theme.scrollbar.thumbHover,
            },
          },
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress sx={{ color: theme.primary }} />
            </Box>
          )}

          {!loading && news.length > 0 && (
            <Grid container spacing={2}>
              {filteredAndSortedNews.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2,
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: theme.divider,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        bgcolor: theme.surfaceHover,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      component="h2"
                      sx={{
                        fontSize: '1rem',
                        lineHeight: 1.4,
                        color: theme.text.primary,
                        mb: 1
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.text.secondary,
                        mb: 0.5,
                        fontSize: '0.875rem'
                      }}
                    >
                      By {item.author}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.text.secondary,
                        fontSize: '0.875rem',
                        mb: 2
                      }}
                    >
                      {item.date}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleArticleClick(item.url)}
                      sx={{ 
                        color: theme.primary,
                        mt: 'auto',
                        alignSelf: 'flex-start',
                        px: 0,
                        '&:hover': { 
                          bgcolor: 'transparent',
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Read More
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
      <ArticleView
        open={selectedArticle !== null}
        onClose={handleCloseArticle}
        article={selectedArticle}
        loading={articleLoading}
        error={articleError}
      />
      <Dialog
        open={openEthicsModal}
        onClose={handleCloseEthicsModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.background,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          color: theme.text.primary,
          fontSize: '1.25rem',
          fontWeight: 500
        }}>
          {ethicsContent.title}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          {ethicsContent.sections.map((section, index) => (
            <Box key={index} sx={{ mb: index !== ethicsContent.sections.length - 1 ? 3 : 0 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: theme.primary,
                  fontWeight: 500,
                  mb: 1
                }}
              >
                {section.title}
              </Typography>
              <DialogContentText sx={{ 
                color: theme.text.secondary,
                fontSize: '0.95rem',
                lineHeight: 1.6,
                mb: 1
              }}>
                {section.content}
              </DialogContentText>
              {section.list && (
                <Box component="ul" sx={{ 
                  pl: 2,
                  mb: 0,
                  '& li': {
                    color: theme.text.secondary,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    mb: 0.5
                  }
                }}>
                  {section.list.map((item, itemIndex) => (
                    <Box component="li" key={itemIndex}>
                      {item}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseEthicsModal}
            sx={{ 
              color: theme.primary,
              '&:hover': {
                backgroundColor: 'rgba(37, 99, 235, 0.04)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
