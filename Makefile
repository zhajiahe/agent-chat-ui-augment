SHELL := /bin/bash

APP_NAME := agent-chat-ui
PORT ?= 3000

.PHONY: help install build start stop restart status logs dev

help:
	@echo "Targets: install build start stop restart status logs dev"

install:
	@pnpm install

build:
	@pnpm build

start:
	@PORT=$(PORT) pm2 start ecosystem.config.cjs --only $(APP_NAME)
	@pm2 save

stop:
	@pm2 stop $(APP_NAME) || true
	@pm2 delete $(APP_NAME) || true

restart:
	@pm2 restart $(APP_NAME) || pm2 start ecosystem.config.cjs --only $(APP_NAME)

status:
	@pm2 status $(APP_NAME) | cat

logs:
	@pm2 logs $(APP_NAME) --lines 200 | cat

dev:
	@pnpm dev


