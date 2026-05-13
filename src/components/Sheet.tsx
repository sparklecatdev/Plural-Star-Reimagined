import React, {ReactNode, useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, LayoutChangeEvent} from 'react-native';
import {TrueSheet} from '@lodev09/react-native-true-sheet';
import {Fonts} from '../theme';

interface SheetProps {
  visible: boolean;
  title: string;
  theme: any;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Sheet — bottom-anchored modal sheet built on @lodev09/react-native-true-sheet.
 *
 * History of this file: react-native-modal (abandoned) → @gorhom/bottom-sheet
 * (incompatible with RN 0.85's Reanimated 4 requirement, see gorhom #2546) →
 * TrueSheet. TrueSheet is a native sheet — iOS 15+ uses UISheetPresentationController,
 * Android uses Material Design 3's native bottom sheet. Because the animation
 * runs in the OS layer, the project no longer needs react-native-reanimated or
 * react-native-gesture-handler installed at all.
 *
 * The external API (visible, title, theme, onClose, children, footer) is
 * preserved, so call sites do not need to change.
 *
 * Bug 8 carryover: the prior react-native-modal implementation had to disable
 * swipe-anywhere-to-close because the lib's gesture coupling fought the inner
 * ScrollView on Android (Refugee Andros report — vertical scroll jamming past
 * ~half the modal height in Edit Member). The gorhom rewrite preserved that
 * defensively. With TrueSheet the OS arbitrates drag vs scroll natively, so
 * the issue cannot recur — the grabber drags the sheet, the ScrollView scrolls
 * its content, no JS layer is involved in routing the gesture.
 */
export const Sheet = ({visible, title, theme: T, onClose, children, footer}: SheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  // Measured at runtime via onLayout. TrueSheet's `scrollable` mode pins the
  // ScrollView's bottom edge to the sheet *container* (not above the footer);
  // the footer floats on top, hiding the final scroll content unless we add
  // contentContainerStyle paddingBottom matching the footer's height.
  // Per TrueSheet v3.10 docs, scrollable behaviour:
  //   "left, right, and bottom edges will be pinned to the container."
  // https://sheet.lodev09.com/reference/configuration#scrollable
  const [footerHeight, setFooterHeight] = useState(0);
  const onFooterLayout = (e: LayoutChangeEvent) => setFooterHeight(e.nativeEvent.layout.height);

  // Drive present/dismiss off the `visible` prop so existing call sites that
  // pass <Sheet visible={x} ... /> keep working unchanged. TrueSheet's preferred
  // API is imperative, but the rest of the app is built around boolean state.
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // Bottom pad = measured footer height + a 24px breathing strip. While the
  // footer hasn't been measured yet (first render), fall back to a generous
  // 96px so the first paint doesn't briefly cut off content. The 56px no-footer
  // value stays as-is — TrueSheet pins the ScrollView's bottom edge to the
  // sheet's container, but the container already accounts for the safe-area
  // inset via `insetAdjustment="automatic"`. The 56 is just visual breathing room.
  const scrollPaddingBottom = footer ? (footerHeight > 0 ? footerHeight + 24 : 96) : 56;

  // 0.92 detent (92% of screen height) matches the previous react-native-modal
  // and gorhom sheet height — keeps a sliver of background visible at the top.
  return (
    <TrueSheet
      ref={sheetRef}
      detents={[0.92]}
      cornerRadius={20}
      backgroundColor={T.card}
      onDidDismiss={onClose}
      scrollable
      header={
        <View style={[s.header, {borderBottomColor: T.border, backgroundColor: T.card}]}>
          <Text style={[s.title, {color: T.text}]}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.closeBtn}>
            <Text style={[s.closeX, {color: T.dim}]}>✕</Text>
          </TouchableOpacity>
        </View>
      }
      footer={
        footer ? (
          <View
            onLayout={onFooterLayout}
            style={[s.footer, {borderTopColor: T.border, backgroundColor: T.card}]}
          >
            {footer}
          </View>
        ) : undefined
      }
    >
      <ScrollView
        style={s.body}
        contentContainerStyle={{paddingBottom: scrollPaddingBottom}}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </TrueSheet>
  );
};

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {fontFamily: Fonts.display, fontSize: 22, fontWeight: '600', fontStyle: 'italic'},
  closeBtn: {padding: 4},
  closeX: {fontSize: 16},
  body: {flex: 1, paddingHorizontal: 20, paddingTop: 16},
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});
