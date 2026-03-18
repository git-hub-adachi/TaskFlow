import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type AuthMode = 'signin' | 'signup'

interface AuthProps {
  /** ログイン／登録成功後に呼び出されるコールバック */
  onSuccess?: () => void
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin')

  // フォーム値
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // UI 状態
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signUpDone, setSignUpDone] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setName('')
    setError('')
    setShowPassword(false)
    setSignUpDone(false)
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    resetForm()
  }

  // ----- Sign In -----
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // 成功 → コールバック or ページ遷移
      onSuccess?.()
      // React Router を使う場合はここを navigate('/dashboard') に変更
    } catch (err: unknown) {
      setError(getJapaneseError(err))
    } finally {
      setLoading(false)
    }
  }

  // ----- Sign Up -----
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('ユーザー名を入力してください')
      return
    }
    if (!name.trim()) {
      setError('フルネームを入力してください')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim(), name: name.trim(), role: 'member' },
        },
      })
      if (error) throw error
      setSignUpDone(true)
    } catch (err: unknown) {
      setError(getJapaneseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* 背景グロー */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl shadow-blue-500/30 bg-gradient-to-br from-blue-500 to-violet-600">
            <span className="text-white text-2xl font-black">TF</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">TaskFlow</h1>
          <p className="mt-1 text-slate-400 text-sm">チームのタスク管理をシンプルに</p>
        </div>

        {/* カード */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden">
          {/* タブ */}
          <div className="flex border-b border-slate-700/60">
            {(['signin', 'signup'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={[
                  'flex-1 py-4 text-sm font-semibold transition-all',
                  mode === m
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-500 hover:text-slate-300',
                ].join(' ')}
              >
                {m === 'signin' ? 'ログイン' : '新規登録'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Sign Up 完了メッセージ */}
            {signUpDone ? (
              <div className="text-center py-4 space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-white font-bold text-lg">確認メールを送信しました</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  <span className="text-blue-400">{email}</span> に確認リンクを送りました。<br />
                  メールを確認してアカウントを有効化してください。
                </p>
                <button
                  onClick={() => switchMode('signin')}
                  className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  ログイン画面に戻る
                </button>
              </div>
            ) : (
              <form
                onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
                className="space-y-4 animate-in fade-in duration-200"
                key={mode}
              >
                {/* エラー */}
                {error && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/40 text-red-400 text-sm px-4 py-3 rounded-xl animate-in fade-in duration-200">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14A7 7 0 0012 5z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* 新規登録のみ：ユーザー名・フルネーム */}
                {mode === 'signup' && (
                  <>
                    <Field label="ユーザー名">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="例: alice_tanaka"
                        className={inputClass}
                        required
                        autoComplete="username"
                      />
                    </Field>
                    <Field label="フルネーム">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例: 田中 アリス"
                        className={inputClass}
                        required
                        autoComplete="name"
                      />
                    </Field>
                  </>
                )}

                {/* メールアドレス */}
                <Field label="メールアドレス">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </Field>

                {/* パスワード */}
                <Field label="パスワード">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass + ' pr-12'}
                      required
                      minLength={6}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    >
                      {showPassword ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-1 text-xs text-slate-500">6文字以上で設定してください</p>
                  )}
                </Field>

                {/* 送信ボタン */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner />
                      {mode === 'signin' ? 'ログイン中...' : '登録中...'}
                    </>
                  ) : mode === 'signin' ? (
                    'ログイン'
                  ) : (
                    'アカウントを作成'
                  )}
                </button>

                {/* モード切替リンク */}
                <p className="text-center text-sm text-slate-500 pt-1">
                  {mode === 'signin' ? (
                    <>
                      アカウントをお持ちでない方は{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        新規登録
                      </button>
                    </>
                  ) : (
                    <>
                      すでにアカウントをお持ちの方は{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        ログイン
                      </button>
                    </>
                  )}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- 補助コンポーネント ----

const inputClass =
  'w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/50 transition-all text-sm'

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
      {label}
    </label>
    {children}
  </div>
)

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
)

const EyeOn = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOff = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

// ---- Supabase エラーを日本語に変換 ----

function getJapaneseError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません'
  if (msg.includes('Email not confirmed')) return 'メールアドレスの確認が完了していません。確認メールをご確認ください'
  if (msg.includes('User already registered')) return 'このメールアドレスはすでに登録されています'
  if (msg.includes('Password should be at least')) return 'パスワードは6文字以上で入力してください'
  if (msg.includes('Unable to validate email')) return '有効なメールアドレスを入力してください'
  if (msg.includes('Email rate limit exceeded')) return 'しばらく時間をおいてから再試行してください'
  if (msg.includes('Network')) return 'ネットワークエラーが発生しました。接続を確認してください'
  return `エラーが発生しました: ${msg}`
}

export default Auth
