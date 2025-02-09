import express from "express";
import path from "path";
import fs from "fs/promises";
import { env } from "../config/environment";

const EMAIL_PREVIEW_DIR = path.join(__dirname, "../.email-previews");

export class EmailPreviewService {
  private static async ensurePreviewDirExists() {
    try {
      await fs.access(EMAIL_PREVIEW_DIR);
    } catch {
      await fs.mkdir(EMAIL_PREVIEW_DIR, { recursive: true });
    }
  }

  static async savePreview(email: {
    to: string;
    subject: string;
    html: string;
  }): Promise<string> {
    if (env.NODE_ENV === "production") return "";

    await this.ensurePreviewDirExists();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${timestamp}-${email.subject.replace(/[^a-z0-9]/gi, "-")}.html`;
    const filePath = path.join(EMAIL_PREVIEW_DIR, filename);

    const previewHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Email Preview: ${email.subject}</title>
          <style>
            .email-meta {
              background: #f5f5f5;
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 5px;
            }
            .email-meta p {
              margin: 5px 0;
            }
            .email-content {
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="email-meta">
            <p><strong>To:</strong> ${email.to}</p>
            <p><strong>Subject:</strong> ${email.subject}</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="email-content">
            ${email.html}
          </div>
        </body>
      </html>
    `;

    await fs.writeFile(filePath, previewHtml);
    return `/email-preview/${filename}`;
  }

  static setupPreviewRoutes(app: express.Application) {
    if (env.NODE_ENV === "production") return;

    // Serve email previews
    app.use("/email-preview", express.static(EMAIL_PREVIEW_DIR));

    // List all email previews
    app.get("/email-previews", async (req, res) => {
      await this.ensurePreviewDirExists();
      
      const files = await fs.readdir(EMAIL_PREVIEW_DIR);
      const previews = files
        .filter(file => file.endsWith(".html"))
        .map(file => ({
          filename: file,
          url: `/email-preview/${file}`,
          sentAt: new Date(file.split("-")[0]).toLocaleString(),
          subject: file
            .replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-/, "")
            .replace(/-/g, " ")
            .replace(".html", "")
        }))
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Email Previews</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .preview-list {
                list-style: none;
                padding: 0;
              }
              .preview-item {
                border: 1px solid #ddd;
                margin: 10px 0;
                padding: 15px;
                border-radius: 5px;
              }
              .preview-item:hover {
                background: #f5f5f5;
              }
              .preview-meta {
                color: #666;
                font-size: 0.9em;
              }
            </style>
          </head>
          <body>
            <h1>Email Previews</h1>
            <ul class="preview-list">
              ${previews.map(preview => `
                <li class="preview-item">
                  <h3>${preview.subject}</h3>
                  <div class="preview-meta">
                    <p>Sent at: ${preview.sentAt}</p>
                  </div>
                  <a href="${preview.url}" target="_blank">View Preview</a>
                </li>
              `).join("")}
            </ul>
          </body>
        </html>
      `);
    });
  }
}
