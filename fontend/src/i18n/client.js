'use client'

import { useEffect, useState } from 'react'
import i18next from 'i18next'
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { getOptions, languages, cookieName } from './setting'
import Cookies from "js-cookie";

const runsOnServerSide = typeof window === 'undefined'

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language, namespace) => import(`./locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    lng: undefined, // let detect the language on client side
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
    preload: runsOnServerSide ? languages : []
  })

export function useTranslation(ns, options) {
  const ret = useTranslationOrg(ns, options)
  const { i18n } = ret


  useEffect(() => {
    if (!runsOnServerSide) {
      //const lng = localStorage.getItem('language')'
      const lng = Cookies.get("i18next");
      if (lng && i18n.resolvedLanguage !== lng) {
        i18n.changeLanguage(lng)
      }
    }
  }, [i18n])


  return ret
}
