import os
import time
import logging
import requests
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

# Load Environment Variables
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ALLOWED_CHAT_ID = os.getenv("ALLOWED_CHAT_ID")
MIN_LIQUIDITY = float(os.getenv("MIN_LIQUIDITY", "1000"))

# Setup Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Track scanned tokens to prevent spam
scanned_tokens = set()

# Registered chats (if ALLOWED_CHAT_ID is not set, anyone who runs /start gets alerts)
active_chats = set()

if ALLOWED_CHAT_ID:
    active_chats.add(int(ALLOWED_CHAT_ID))

def check_liquidity(token_address: str) -> dict:
    """Check DexScreener for liquidity of the token."""
    try:
        url = f"https://api.dexscreener.com/latest/dex/tokens/{token_address}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            pairs = data.get("pairs", [])
            if not pairs:
                return {"success": False, "reason": "No pairs found"}
                
            sol_pairs = [p for p in pairs if p.get("chainId") == "solana"]
            if not sol_pairs:
                return {"success": False, "reason": "No Solana pairs"}
                
            best_pair = max(sol_pairs, key=lambda x: x.get("liquidity", {}).get("usd", 0))
            return {
                "success": True,
                "liquidity": best_pair.get("liquidity", {}).get("usd", 0),
                "market_cap": best_pair.get("marketCap", best_pair.get("fdv", 0)),
                "symbol": best_pair.get("baseToken", {}).get("symbol", "UNKNOWN")
            }
    except Exception as e:
        logger.error(f"Error checking DexScreener liquidity for {token_address}: {e}")
    
    return {"success": False, "reason": "API Error"}

def check_rugcheck(token_address: str) -> dict:
    """Check RugCheck API for a given token address."""
    try:
        url = f"https://api.rugcheck.xyz/v1/tokens/{token_address}/report/summary"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            # Count danger risks
            danger_risks = [r for r in data.get("risks", []) if r.get("level") == "danger"]
            
            return {
                "success": True,
                "is_safe": len(danger_risks) == 0,
                "danger_count": len(danger_risks),
                "score": data.get("score", 0),
                "risks": danger_risks
            }
    except Exception as e:
        logger.error(f"Error checking RugCheck for {token_address}: {e}")
    
    return {"success": False}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    chat_id = update.effective_chat.id
    
    if ALLOWED_CHAT_ID and str(chat_id) != ALLOWED_CHAT_ID:
        await update.message.reply_text("⛔ You are not authorized to use this bot.")
        return
        
    active_chats.add(chat_id)
    await update.message.reply_text(
        "🤖 *SolPulse Crypto Screener Bot Started!*\n\n"
        "I will monitor DEX Screener for new Solana tokens and verify their safety using RugCheck.\n\n"
        "Commands:\n"
        "/scan <address> - Manually scan a specific token\n"
        "/status - Check bot status",
        parse_mode="Markdown"
    )

async def scan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /scan <address> command"""
    chat_id = update.effective_chat.id
    if ALLOWED_CHAT_ID and str(chat_id) != ALLOWED_CHAT_ID:
        return
        
    if not context.args:
        await update.message.reply_text("Please provide a token address. Example:\n`/scan 7GCihgDB8fe6KNjn2TwD4X9n8x5gB8vWjCj3V93U6V5r`", parse_mode="Markdown")
        return
        
    address = context.args[0]
    await update.message.reply_text(f"🔍 Scanning `{address}`...", parse_mode="Markdown")
    
    # Check RugCheck
    rc_result = check_rugcheck(address)
    
    if not rc_result["success"]:
        await update.message.reply_text("❌ Failed to fetch data from RugCheck.")
        return
        
    if rc_result["is_safe"]:
        msg = (
            f"✅ *SAFE TOKEN DETECTED*\n"
            f"`{address}`\n\n"
            f"🛡️ *RugCheck Score:* {rc_result['score']}\n"
            f"⚠️ *Danger Risks:* 0\n\n"
            f"[View on Solscan](https://solscan.io/token/{address}) | [DexScreener](https://dexscreener.com/solana/{address})"
        )
    else:
        risks_text = "\n".join([f"- {r.get('name')}" for r in rc_result['risks']])
        msg = (
            f"🚨 *RISKY TOKEN DETECTED*\n"
            f"`{address}`\n\n"
            f"🛡️ *RugCheck Score:* {rc_result['score']}\n"
            f"⚠️ *Danger Risks:* {rc_result['danger_count']}\n"
            f"{risks_text}\n\n"
            f"[View on Solscan](https://solscan.io/token/{address})"
        )
        
    await update.message.reply_text(msg, parse_mode="Markdown", disable_web_page_preview=True)

async def check_new_tokens(context: ContextTypes.DEFAULT_TYPE):
    """Background task to fetch new tokens and scan them"""
    if not active_chats:
        return # No one to send alerts to
        
    try:
        # Fetch newly created tokens from DexScreener
        response = requests.get("https://api.dexscreener.com/token-profiles/latest/v1", timeout=10)
        if response.status_code != 200:
            return
            
        data = response.json()
        if not isinstance(data, list):
            return
            
        solana_tokens = [t for t in data if t.get("chainId") == "solana"]
        
        for token in solana_tokens:
            address = token.get("tokenAddress")
            
            # Skip if already scanned
            if address in scanned_tokens:
                continue
                
            scanned_tokens.add(address)
            
            # Prevent memory leak
            if len(scanned_tokens) > 5000:
                scanned_tokens.clear()
                
            # Sleep slightly to avoid rate limits
            time.sleep(1)
            
            # 1. Check Liquidity First
            dex_data = check_liquidity(address)
            if not dex_data["success"] or dex_data["liquidity"] < MIN_LIQUIDITY:
                continue # Skip tokens with low liquidity
                
            # 2. Check RugCheck
            rc_result = check_rugcheck(address)
            if rc_result["success"] and rc_result["is_safe"]:
                # Only alert for SAFE tokens
                symbol = dex_data.get("symbol", "UNKNOWN")
                
                msg = (
                    f"🚀 *NEW SAFE TOKEN DETECTED*\n\n"
                    f"💰 *{symbol}* (`{address}`)\n"
                    f"💧 *Liquidity:* ${dex_data.get('liquidity', 0):,.2f}\n"
                    f"📈 *Market Cap:* ${dex_data.get('market_cap', 0):,.2f}\n"
                    f"🛡️ *RugCheck Score:* {rc_result['score']} (No Danger Risks)\n\n"
                    f"📊 [View on DexScreener]({token.get('url', f'https://dexscreener.com/solana/{address}')})\n"
                    f"🔍 [View on RugCheck](https://rugcheck.xyz/tokens/{address})\n"
                    f"💰 [Trade on Raydium](https://raydium.io/swap/?inputCurrency=sol&outputCurrency={address})"
                )
                
                for chat_id in active_chats:
                    try:
                        await context.bot.send_message(chat_id=chat_id, text=msg, parse_mode="Markdown", disable_web_page_preview=True)
                    except Exception as e:
                        logger.error(f"Failed to send message to {chat_id}: {e}")
                        
    except Exception as e:
        logger.error(f"Error in background task: {e}")

async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check bot status"""
    await update.message.reply_text(f"🟢 Bot is running and monitoring DEX Screener.\nTokens scanned in memory: {len(scanned_tokens)}")

def main():
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is not set in .env file!")
        return

    # Build Application
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("scan", scan))
    app.add_handler(CommandHandler("status", status))

    # Job Queue for background scanning (runs every 60 seconds)
    job_queue = app.job_queue
    job_queue.run_repeating(check_new_tokens, interval=60, first=10)

    logger.info("Bot is starting...")
    app.run_polling()

if __name__ == "__main__":
    main()
