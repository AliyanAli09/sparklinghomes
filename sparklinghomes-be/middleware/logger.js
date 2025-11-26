import chalk from 'chalk';

// Concise logger middleware
export const logger = (req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  // Color coding for methods
  const methodColors = {
    GET: chalk.green,
    POST: chalk.blue,
    PUT: chalk.yellow,
    DELETE: chalk.red,
    PATCH: chalk.magenta
  };
  
  const coloredMethod = methodColors[method] ? methodColors[method](method) : chalk.white(method);
  
  // Log request (concise)
  console.log(`${coloredMethod} ${chalk.white(url)} - ${chalk.gray(ip)}`);
  
  // Override res.end to log response (concise)
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Color coding for status codes
    let statusColor;
    if (statusCode >= 200 && statusCode < 300) statusColor = chalk.green;
    else if (statusCode >= 300 && statusCode < 400) statusColor = chalk.blue;
    else if (statusCode >= 400 && statusCode < 500) statusColor = chalk.yellow;
    else statusColor = chalk.red;
    
    // Log response (concise)
    console.log(`  ${statusColor(statusCode)} - ${chalk.gray(duration + 'ms')}`);
    
    // Call the original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Simple request logger (alternative)
export const simpleLogger = (req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  const method = req.method;
  const url = req.originalUrl;
  
  console.log(`${timestamp} - ${method} ${url}`);
  next();
};

// Error logger (concise)
export const errorLogger = (err, req, res, next) => {
  const method = req.method;
  const url = req.originalUrl;
  
  console.error(`❌ ${chalk.red(method)} ${chalk.white(url)} - ${chalk.red(err.message)}`);
  
  next(err);
};

export default logger;
