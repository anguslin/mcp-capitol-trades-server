import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Interface for scraped webpage data
 */
export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  html: string;
  text: string;
  timestamp: string;
}

/**
 * Interface for extracted link data
 */
export interface LinkData {
  href: string;
  text: string;
  title?: string;
}

/**
 * Scrape a webpage and extract structured content
 * @param url - The URL to scrape
 * @param selector - Optional CSS selector to target specific content
 * @returns Scraped data including title, description, and content
 */
export async function scrapeWebPage(
  url: string,
  selector?: string
): Promise<ScrapedData> {
  try {
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 30000, // 30 second timeout
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract title
    const title = $("title").text().trim() || $("h1").first().text().trim();

    // Extract meta description
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    // Extract text content
    let textContent: string;
    if (selector) {
      // If selector provided, extract from specific elements
      textContent = $(selector)
        .map((_, el) => $(el).text())
        .get()
        .join("\n")
        .trim();
    } else {
      // Remove script, style, and other non-content tags
      $("script, style, nav, footer, header, aside, iframe").remove();
      
      // Extract main content
      const mainContent =
        $("main").text() ||
        $("article").text() ||
        $('[role="main"]').text() ||
        $("body").text();
      
      textContent = mainContent
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim();
    }

    return {
      url,
      title,
      description,
      html,
      text: textContent,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to scrape webpage: ${error.message} (${error.response?.status || "unknown status"})`
      );
    }
    throw new Error(`Failed to scrape webpage: ${error}`);
  }
}

/**
 * Extract all links from a webpage
 * @param url - The URL to extract links from
 * @param filterPattern - Optional regex pattern to filter links
 * @returns Array of link data
 */
export async function extractLinks(
  url: string,
  filterPattern?: string
): Promise<LinkData[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const links: LinkData[] = [];
    const seenHrefs = new Set<string>();

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      const text = $(element).text().trim();
      const title = $(element).attr("title");

      if (href && !seenHrefs.has(href)) {
        // Convert relative URLs to absolute
        let absoluteHref: string;
        try {
          absoluteHref = new URL(href, url).href;
        } catch {
          // If URL parsing fails, keep original href
          absoluteHref = href;
        }

        // Apply filter if provided
        if (filterPattern) {
          const regex = new RegExp(filterPattern, "i");
          if (!regex.test(absoluteHref) && !regex.test(text)) {
            return; // Skip this link
          }
        }

        seenHrefs.add(href);
        links.push({
          href: absoluteHref,
          text,
          title,
        });
      }
    });

    return links;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to extract links: ${error.message}`);
    }
    throw new Error(`Failed to extract links: ${error}`);
  }
}

/**
 * Extract text content from specific elements
 * @param url - The URL to scrape
 * @param selector - CSS selector for target elements
 * @returns Array of text content from matched elements
 */
export async function extractText(
  url: string,
  selector: string
): Promise<string[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const texts: string[] = [];

    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        texts.push(text);
      }
    });

    return texts;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to extract text: ${error.message}`);
    }
    throw new Error(`Failed to extract text: ${error}`);
  }
}

/**
 * Find a specific link on a webpage using a filter function
 * @param url - The URL to extract links from
 * @param filter - Filter function to match the desired link
 * @returns The matching link with targetUrl and buttonText
 */
export async function findLink(
  url: string,
  filter: (link: LinkData) => boolean
): Promise<{ targetUrl: string; buttonText: string }> {
  // Get all links
  const links = await extractLinks(url);
  
  // Filter to find the one you want
  const targetLink = links.find(filter);
  
  if (!targetLink) {
    throw new Error("No link matched the filter criteria");
  }
  
  return {
    targetUrl: targetLink.href,
    buttonText: targetLink.text,
  };
}

